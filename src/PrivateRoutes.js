import { Navigate, Outlet } from 'react-router-dom'
import Cookies from 'universal-cookie'
const PrivateRoutes = () => {
    const cookies = new Cookies();
    let authToken = cookies.get("auth-cookie");

return (
  authToken ? <Outlet/> : <Navigate to='/'/>
  )
}
export default PrivateRoutes;