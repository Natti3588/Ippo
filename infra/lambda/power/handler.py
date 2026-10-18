import json
import os
import time
from dataclasses import dataclass

import boto3

POLL_SECONDS = 10
NAT_LIMIT_SECONDS = 120
DB_LIMIT_SECONDS = 720
ALARM_LIMIT_SECONDS = 600


@dataclass
class Config:
    cluster: str
    services: list[str]
    db_instance: str
    nat_instance_id: str
    alarm_prefix: str

    @classmethod
    def from_env(cls, env):
        return cls(
            cluster=env["CLUSTER"],
            services=[s for s in env["SERVICES"].split(",") if s],
            db_instance=env["DB_INSTANCE"],
            nat_instance_id=env["NAT_INSTANCE_ID"],
            alarm_prefix=env["ALARM_PREFIX"],
        )


@dataclass
class Clients:
    ec2: object
    rds: object
    ecs: object
    cloudwatch: object
    lambda_: object


def handler(event, context):
    clients = Clients(
        ec2=boto3.client("ec2"),
        rds=boto3.client("rds"),
        ecs=boto3.client("ecs"),
        cloudwatch=boto3.client("cloudwatch"),
        lambda_=boto3.client("lambda"),
    )
    result = run(event.get("action"), Config.from_env(os.environ), clients, context.function_name)
    print(json.dumps(result))
    return result


def run(action, cfg, clients, function_name, sleep=time.sleep, clock=time.monotonic):
    power = Power(cfg, clients, sleep, clock)
    if action == "start":
        done = power.start(function_name)
    elif action == "stop":
        done = power.stop()
    elif action == "enable-alarms":
        done = power.enable_alarms()
    else:
        raise ValueError(f"unknown action: {action!r}")
    return {"action": action, "done": done}


class Power:
    def __init__(self, cfg, clients, sleep, clock):
        self.cfg = cfg
        self.clients = clients
        self.sleep = sleep
        self.clock = clock

    def start(self, function_name):
        done = []
        self.start_nat(done)
        self.start_db(done)
        self.scale(1, done)
        self.clients.lambda_.invoke(
            FunctionName=function_name,
            InvocationType="Event",
            Payload=json.dumps({"action": "enable-alarms"}).encode(),
        )
        done.append("invoke-enable-alarms")
        return done

    def stop(self):
        done = []
        names = self.alarm_names()
        if names:
            self.clients.cloudwatch.disable_alarm_actions(AlarmNames=names)
            done.append("disable-alarms")
        self.scale(0, done)
        self.stop_db(done)
        self.stop_nat(done)
        return done

    def enable_alarms(self):
        names = self.alarm_names()
        if not names:
            return []
        try:
            self.wait(self.firing_alarms, lambda firing: not firing, ALARM_LIMIT_SECONDS, "alarms")
        except TimeoutError as err:
            self.clients.cloudwatch.enable_alarm_actions(AlarmNames=names)
            raise RuntimeError(f"enabled alarm actions while still in ALARM: {err}") from err
        self.clients.cloudwatch.enable_alarm_actions(AlarmNames=names)
        return ["enable-alarms"]

    def start_nat(self, done):
        state = self.nat_state()
        if state == "stopping":
            state = self.wait(self.nat_state, lambda s: s == "stopped", NAT_LIMIT_SECONDS, "nat")
        if state == "stopped":
            self.clients.ec2.start_instances(InstanceIds=[self.cfg.nat_instance_id])
            done.append("nat-start")
        if state != "running":
            self.wait(self.nat_state, lambda s: s == "running", NAT_LIMIT_SECONDS, "nat")

    def stop_nat(self, done):
        state = self.nat_state()
        if state == "pending":
            state = self.wait(self.nat_state, lambda s: s == "running", NAT_LIMIT_SECONDS, "nat")
        if state == "running":
            self.clients.ec2.stop_instances(InstanceIds=[self.cfg.nat_instance_id])
            done.append("nat-stop")

    def start_db(self, done):
        status = self.db_status()
        if status == "stopping":
            status = self.wait(self.db_status, lambda s: s == "stopped", DB_LIMIT_SECONDS, "db")
        if status == "stopped":
            self.clients.rds.start_db_instance(DBInstanceIdentifier=self.cfg.db_instance)
            done.append("db-start")
        if status != "available":
            self.wait(self.db_status, lambda s: s == "available", DB_LIMIT_SECONDS, "db")

    def stop_db(self, done):
        status = self.db_status()
        if status == "starting":
            status = self.wait(self.db_status, lambda s: s == "available", DB_LIMIT_SECONDS, "db")
        if status == "available":
            self.clients.rds.stop_db_instance(DBInstanceIdentifier=self.cfg.db_instance)
            done.append("db-stop")

    def scale(self, count, done):
        for service in self.cfg.services:
            self.clients.ecs.update_service(
                cluster=self.cfg.cluster, service=service, desiredCount=count
            )
        done.append(f"ecs={count}")

    def nat_state(self):
        res = self.clients.ec2.describe_instances(InstanceIds=[self.cfg.nat_instance_id])
        return res["Reservations"][0]["Instances"][0]["State"]["Name"]

    def db_status(self):
        res = self.clients.rds.describe_db_instances(DBInstanceIdentifier=self.cfg.db_instance)
        return res["DBInstances"][0]["DBInstanceStatus"]

    def alarm_names(self):
        res = self.clients.cloudwatch.describe_alarms(AlarmNamePrefix=self.cfg.alarm_prefix)
        return [a["AlarmName"] for a in res["MetricAlarms"]]

    def firing_alarms(self):
        res = self.clients.cloudwatch.describe_alarms(
            AlarmNamePrefix=self.cfg.alarm_prefix, StateValue="ALARM"
        )
        return [a["AlarmName"] for a in res["MetricAlarms"]]

    def wait(self, read, ready, limit, what):
        deadline = self.clock() + limit
        value = read()
        while not ready(value):
            if self.clock() >= deadline:
                raise TimeoutError(f"{what} is still {value!r} after {limit}s")
            self.sleep(POLL_SECONDS)
            value = read()
        return value
