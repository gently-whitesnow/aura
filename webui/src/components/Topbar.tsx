import { useUser } from '../store/user'

export default function Topbar() {
  const { info, loading, refresh } = useUser()
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm opacity-70">
        {loading ? 'Загрузка…' : info?.login ? info.login : 'anonymous'}
      </span>
      <span className="text-sm opacity-70 min-w-[8rem] text-right">
        {loading ? '' : info?.isAdmin ? 'Админ' : 'Пользователь'}
      </span>
      <button className="btn btn-xs" onClick={refresh}>Обновить</button>
    </div>
  )
}


