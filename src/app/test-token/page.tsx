import { auth } from '@clerk/nextjs/server'

export default async function TestTokenPage() {
  const { getToken, userId } = await auth()
  const token = await getToken()
  return (
    <div>
      <p>userId: {userId}</p>
      <p>token: {token}</p>
    </div>
  )
}
