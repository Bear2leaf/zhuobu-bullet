import * as esbuild from 'esbuild';
/**
 * @type {esbuild.SameShape<esbuild.BuildOptions, esbuild.CommonOptions>}
 */
const config = {
    entryPoints: ['client/main.ts', 'worker/main.ts'],
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    external: ['fs', 'path'],
    target: 'es2015',
    logLevel: 'info',
    sourcemap: true,
}


const ctx = await esbuild.context(config)
ctx.serve({
  servedir: '.',
})
await ctx.watch();