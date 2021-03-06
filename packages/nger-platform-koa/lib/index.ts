import { TypeContext } from 'ims-decorator';
import { createServer } from 'http';
import Koa from 'koa';
import { ConsoleLogger, LogLevel } from 'nger-logger';
import { NgerUtil } from 'nger-util';
import Router from 'koa-router';
import Static from 'koa-static';

import { NgModuleMetadataKey, NgModuleClassAst, ControllerMetadataKey, ControllerClassAst, GetMethodAst, PostMethodAst, GetMetadataKey, PostMetadataKey } from 'nger-core';
import { join } from 'path';
export class NgerPlatformKoa {
    logger: ConsoleLogger
    util: NgerUtil;
    constructor() {
        this.logger = new ConsoleLogger(LogLevel.debug);
        this.util = new NgerUtil(this.logger)
    }
    async run(context: TypeContext) {
        const KoaPkg = await this.util.loadPkg<typeof Koa>('koa');
        const KoaRouter = await this.util.loadPkg<typeof Router>('koa-router')
        const KoaStatic = await this.util.loadPkg<typeof Static>('koa-static')
        const app = new KoaPkg();
        const router = new KoaRouter();
        const server = createServer(app.callback())
        const port = context.get(`port`);
        app.use(KoaStatic(join(this.util.root, 'template')))
        app.use(KoaStatic(join(this.util.root, 'attachment')))
        app.use(async (ctx, next) => {
            await next();
            const rt = ctx.response.get('X-Response-Time');
            this.logger.info(`${ctx.method} ${ctx.url} - ${rt}`);
        });

        app.use(async (ctx, next) => {
            const start = Date.now();
            await next();
            const ms = Date.now() - start;
            ctx.set('X-Response-Time', `${ms}ms`);
        });

        const ngModule = context.getClass(NgModuleMetadataKey) as NgModuleClassAst;
        ngModule.declarations.map(declaration => {
            const controller = declaration.getClass(ControllerMetadataKey) as ControllerClassAst;
            const gets = declaration.getMethod(GetMetadataKey) as GetMethodAst[];
            const posts = declaration.getMethod(PostMetadataKey) as PostMethodAst[];
            gets.map(get => {
                this.logger.debug(`get ${controller.path}/${get.path}`)
                router.get(`${controller.path}/${get.path}`, async (ctx) => {
                    const data = await declaration.instance[get.ast.propertyKey]();
                    ctx.body = data;
                });
            });
            posts.map(post => {
                this.logger.debug(`post ${controller.path}/${post.path}`)
                router.post(`${controller.path}/${post.path}`, async (ctx) => {
                    const data = await declaration.instance[post.ast.propertyKey]();
                    ctx.body = data;
                })
            });
        });
        app.use(router.routes()).use(router.allowedMethods())
        server.listen(port, () => {
            this.logger.info(`app start at http://localhost:${port}`)
        });
    }
}