import prosemirrorSync from '@convex-dev/prosemirror-sync/convex.config.js'
import resend from '@convex-dev/resend/convex.config.js'
import { defineApp } from 'convex/server'
import betterAuth from './betterAuth/convex.config'

const app = defineApp()

app.use(betterAuth)
app.use(resend)
app.use(prosemirrorSync)

export default app
