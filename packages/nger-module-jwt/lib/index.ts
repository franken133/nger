import { NgModule, Controller, Inject, Post } from "nger-core";
import { NgerModuleTypeorm } from "nger-module-typeorm";
import { NgerRunnerTypeorm } from "src/typeorm";
import { NgerJwtService } from "./service";
import { ModuleWithProviders } from "nger-di";

let defaultPath = "";

@Controller({
  path: defaultPath
})
class NgerJwtController {

  constructor(@Inject() private service: NgerJwtService) {
  }


  @Post()
  register(username: string, password: string) {

  }
}

@NgModule({
  imports: [NgerModuleTypeorm.forRoot(NgerRunnerTypeorm)],
  providers: [NgerJwtService],
  declarations: [NgerJwtController]
})
export class NgerModuleJwt {
  static forRoot(path: string = "oauth"): ModuleWithProviders {
    return {
      ngModule: NgerModuleJwt,
      providers: [NgerJwtService]
    };
  }
}
