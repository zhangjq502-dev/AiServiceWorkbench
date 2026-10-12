import type { PingResponse } from "../types";

interface PingCardProps {
  data:PingResponse | null
  loading:boolean
  error:string | null
  onRefresh: () =>  void
}

function PingCard({data,loading,error,onRefresh}:PingCardProps){
  return (
    <div>
      <button onClick={onRefresh} disabled={loading}>
        {loading ? '请求中....' : '测试后端连接中'}
      </button>
      {error && <p style={{color:'red'}}>出错了：{error}</p>}
      {data && <p>{data.message} @ {data.time}</p>}
    </div>
  )
}

export default PingCard;