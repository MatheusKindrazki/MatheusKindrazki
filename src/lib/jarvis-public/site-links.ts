/**
 * Link allowlist for the chat panel, derived once from the site's published
 * content. Relative imports keep it loadable by the test helper.
 */
import { profile, projects, writing } from '../content'
import { publicLinkTargets } from './links'

export const LINK_TARGETS = publicLinkTargets({ profile, projects, writing })
export const LINK_EMAILS = [profile.email.toLowerCase()]
