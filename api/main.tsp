import "@typespec/http";

import "./models/auth.tsp";
import "./models/board.tsp";
import "./models/errors.tsp";
import "./routes/auth.tsp";
import "./routes/board.tsp";

@service(#{ title: "Ippo" })
namespace Ippo;
