import json
import unittest

import boto3
from botocore.stub import Stubber

import handler

REGION = "ap-northeast-1"
NAT = "i-nat"
DB = "ippo-db"
ALARMS = ["ippo-backend-healthy-hosts", "ippo-frontend-healthy-hosts"]
SERVICES = ["ippo-backend", "ippo-frontend"]
ENABLE_ALARMS = json.dumps({"action": "enable-alarms"}).encode()


def client(name):
    return boto3.client(
        name,
        region_name=REGION,
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )


class FakeTime:
    def __init__(self):
        self.now = 0.0

    def sleep(self, seconds):
        self.now += seconds

    def clock(self):
        return self.now


class PowerTest(unittest.TestCase):
    def setUp(self):
        self.cfg = handler.Config(
            cluster="ippo",
            services=SERVICES,
            db_instance=DB,
            nat_instance_id=NAT,
            alarm_prefix="ippo-",
        )
        self.clients = handler.Clients(
            ec2=client("ec2"),
            rds=client("rds"),
            ecs=client("ecs"),
            cloudwatch=client("cloudwatch"),
            lambda_=client("lambda"),
        )
        self.stubs = {
            name: Stubber(getattr(self.clients, name))
            for name in ("ec2", "rds", "ecs", "cloudwatch", "lambda_")
        }
        for stub in self.stubs.values():
            stub.activate()
        self.time = FakeTime()

    def tearDown(self):
        for stub in self.stubs.values():
            stub.deactivate()

    def run_action(self, action):
        return handler.run(
            action,
            self.cfg,
            self.clients,
            "ippo-power",
            sleep=self.time.sleep,
            clock=self.time.clock,
        )

    def assert_all_called(self):
        for stub in self.stubs.values():
            stub.assert_no_pending_responses()

    def nat(self, state):
        self.stubs["ec2"].add_response(
            "describe_instances",
            {"Reservations": [{"Instances": [{"InstanceId": NAT, "State": {"Name": state}}]}]},
            {"InstanceIds": [NAT]},
        )

    def db(self, status):
        self.stubs["rds"].add_response(
            "describe_db_instances",
            {"DBInstances": [{"DBInstanceIdentifier": DB, "DBInstanceStatus": status}]},
            {"DBInstanceIdentifier": DB},
        )

    def alarm_names(self, names):
        self.stubs["cloudwatch"].add_response(
            "describe_alarms",
            {"MetricAlarms": [{"AlarmName": n} for n in names]},
            {"AlarmNamePrefix": "ippo-"},
        )

    def firing(self, names):
        self.stubs["cloudwatch"].add_response(
            "describe_alarms",
            {"MetricAlarms": [{"AlarmName": n} for n in names]},
            {"AlarmNamePrefix": "ippo-", "StateValue": "ALARM"},
        )

    def ecs(self, count):
        for service in SERVICES:
            self.stubs["ecs"].add_response(
                "update_service",
                {},
                {"cluster": "ippo", "service": service, "desiredCount": count},
            )

    def disable(self, names):
        self.stubs["cloudwatch"].add_response("disable_alarm_actions", {}, {"AlarmNames": names})

    def enable(self, names):
        self.stubs["cloudwatch"].add_response("enable_alarm_actions", {}, {"AlarmNames": names})

    def stop_db(self):
        self.stubs["rds"].add_response("stop_db_instance", {}, {"DBInstanceIdentifier": DB})

    def start_db(self):
        self.stubs["rds"].add_response("start_db_instance", {}, {"DBInstanceIdentifier": DB})

    def stop_nat(self):
        self.stubs["ec2"].add_response("stop_instances", {}, {"InstanceIds": [NAT]})

    def start_nat(self):
        self.stubs["ec2"].add_response("start_instances", {}, {"InstanceIds": [NAT]})

    def invoke_enable_alarms(self):
        self.stubs["lambda_"].add_response(
            "invoke",
            {"StatusCode": 202},
            {"FunctionName": "ippo-power", "InvocationType": "Event", "Payload": ENABLE_ALARMS},
        )

    def test_stop_when_running(self):
        self.alarm_names(ALARMS)
        self.disable(ALARMS)
        self.ecs(0)
        self.db("available")
        self.stop_db()
        self.nat("running")
        self.stop_nat()

        self.run_action("stop")

        self.assert_all_called()

    def test_stop_when_already_stopped(self):
        self.alarm_names(ALARMS)
        self.disable(ALARMS)
        self.ecs(0)
        self.db("stopped")
        self.nat("stopped")

        self.run_action("stop")

        self.assert_all_called()

    def test_stop_without_alarms(self):
        self.alarm_names([])
        self.ecs(0)
        self.db("stopped")
        self.nat("stopped")

        self.run_action("stop")

        self.assert_all_called()

    def test_stop_waits_for_pending_nat(self):
        self.alarm_names(ALARMS)
        self.disable(ALARMS)
        self.ecs(0)
        self.db("stopped")
        self.nat("pending")
        self.nat("running")
        self.stop_nat()

        self.run_action("stop")

        self.assert_all_called()

    def test_start_from_stopped(self):
        self.nat("stopped")
        self.start_nat()
        self.nat("pending")
        self.nat("running")
        self.db("stopped")
        self.start_db()
        self.db("starting")
        self.db("available")
        self.ecs(1)
        self.invoke_enable_alarms()

        self.run_action("start")

        self.assert_all_called()

    def test_start_waits_for_stopping_db(self):
        self.nat("running")
        self.db("stopping")
        self.db("stopping")
        self.db("stopped")
        self.start_db()
        self.db("available")
        self.ecs(1)
        self.invoke_enable_alarms()

        self.run_action("start")

        self.assert_all_called()

    def test_start_when_already_running(self):
        self.nat("running")
        self.db("available")
        self.ecs(1)
        self.invoke_enable_alarms()

        self.run_action("start")

        self.assert_all_called()

    def test_start_timeout_does_not_invoke_enable_alarms(self):
        self.nat("running")
        self.db("stopped")
        self.start_db()
        for _ in range(720 // 10 + 1):
            self.db("starting")

        with self.assertRaises(TimeoutError):
            self.run_action("start")

        self.assert_all_called()

    def test_enable_alarms_when_ok(self):
        self.alarm_names(ALARMS)
        self.firing([ALARMS[0]])
        self.firing([])
        self.enable(ALARMS)

        self.run_action("enable-alarms")

        self.assert_all_called()

    def test_enable_alarms_still_alarm(self):
        self.alarm_names(ALARMS)
        for _ in range(600 // 10 + 1):
            self.firing([ALARMS[0]])
        self.enable(ALARMS)

        with self.assertRaises(RuntimeError):
            self.run_action("enable-alarms")

        self.assert_all_called()

    def test_unknown_action(self):
        with self.assertRaises(ValueError):
            self.run_action("nope")

        self.assert_all_called()


if __name__ == "__main__":
    unittest.main()
