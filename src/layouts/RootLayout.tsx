import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from '../modules'

const RootLayout = () => {
const navigate = useNavigate()
  useEffect(()=>{
  navigate("/home")
  },[navigate])

  return (
    <div className=''>
      <Header/>
     <Outlet/>
    </div>
  )
}

export default RootLayout