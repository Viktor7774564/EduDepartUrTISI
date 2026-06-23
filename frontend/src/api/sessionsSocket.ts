import { io, type Socket } from 'socket.io-client'

import type { AdminSession } from '@/api/admin'
import { getSessionsSocketUrl } from '@/config/api'

export type SessionsSocketHandlers = {
  onSync: (sessions: AdminSession[]) => void
  onCreated: (session: AdminSession) => void
  onRemoved: (payload: { id: number }) => void
  onConnectError?: (error: Error) => void
}

export function connectSessionsSocket(
    token: string,
    handlers: SessionsSocketHandlers,
): Socket {
  const socket = io(getSessionsSocketUrl(), {
    auth: { token },
    transports: ['websocket'],
  })

  socket.on('sessions:sync', handlers.onSync)
  socket.on('session:created', handlers.onCreated)
  socket.on('session:removed', handlers.onRemoved)

  if (handlers.onConnectError) {
    socket.on('connect_error', handlers.onConnectError)
  }

  return socket
}
