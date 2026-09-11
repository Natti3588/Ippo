import "@typespec/http";

import "./models/auth.tsp";
import "./models/board.tsp";
import "./routes/auth.tsp";
import "./routes/board.tsp";

using Http;

@service(#{ title: "Ippo" })
namespace Ippo;
