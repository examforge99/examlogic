import { useEffect, useState } from 'react'

interface Subject {
  name: string
  count: number
  color: string
}

interface Test {
  id: string
  title: string
  date: string
  subjects: string
  score: number
}

interface DashboardData {
  subjects: Subject[]
  tests: Test[]
}

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
}

export function useDashboard(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchAll() {
      try {
        const [scoreRes, testsRes] = await Promise.all([
          fetch('/api/dashboard/score-distribution'),
          fetch('/api/dashboard/recent-tests'),
        ])

        if (!scoreRes.ok || !testsRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const [scoreData, testsData] = await Promise.all([
          scoreRes.json(),
          testsRes.json(),
        ])

        setState({
          data: {
            subjects: scoreData.subjects ?? [],
            tests: testsData.tests ?? [],
          },
          loading: false,
          error: null,
        })
      } catch (err) {
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Something went wrong',
        })
      }
    }

    fetchAll()
  }, [])

  return state
    }
