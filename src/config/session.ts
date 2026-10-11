/** Cookie names shared by the proxy, the API and server components. */
export const ACCESS_COOKIE = 'pc_access'
export const REFRESH_COOKIE = 'pc_refresh'

/** What the header, footer and portal navigation need to know about the visitor. */
export type Viewer = { id: string; role: 'MEMBER' | 'SUPER_ADMIN'; firstName: string; lastName: string; photoUrl: string | null } | null
