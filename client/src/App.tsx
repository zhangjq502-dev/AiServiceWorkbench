import { useState } from "react"
import PingCard from "./components/PingCard"
import type { PingResponse } from "./types"

const App = () => {
  const [data,setData] = useState<PingResponse | null>(null)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string | null>(null)
  const [agentName,setAgentName] = useState('')
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgentName(e.target.value)
  }
  const handlePing = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ping')
      if(!res.ok){
        throw new Error(`HTTP ${res.status}`)
      }
      const json:PingResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))      
    } finally {
      setLoading(false)
    }
  }
  return (
    <div style={{padding:24}}>
      <h1>AI 智能工作台</h1>
      <input value={agentName} onChange={handleNameChange} placeholder="客服名称"></input>
      <p>当前客服：{agentName || '未登录'}</p>
      <PingCard data={data} loading={loading} error={error} onRefresh={handlePing}/>
    </div>
  )
}

export default App