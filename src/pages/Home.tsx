import type { menuListType } from "@/@types"
import { Banner1, Banner2, MenuItemImg } from "@/assets/images"
import { BannerCarousel, Button, MenuItem } from "@/components"


import { MoveRight } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"




const Home = () => {
  const [menuId,setMenuId] = useState<string>("0")
  
  const menuList:menuListType[] = [
    {
      id:1,
      content: "Лаваш",
      image : MenuItemImg,
      menuColor : "#6A0DAD"
    },
    {
      id:2,
      content: "Бургеры",
      image : MenuItemImg,
      menuColor : "#E63946"
    },
    {
      id:3,
      content: "Пиццы",
      image : MenuItemImg,
      menuColor : "#F4A261"
    },
    {
      id:4,
      content: "Хот-доги",
      image : MenuItemImg,
      menuColor : "#264653"
    },
    {
      id:5,
      content: "Салаты",
      image : MenuItemImg,
      menuColor : "#6AE9E3"
    },
    {
      id:6,
      content: "Десерты",
      image : MenuItemImg,
      menuColor : "#D62828"
    },
    {
      id:7,
      content: "Напитки",
      image : MenuItemImg,
      menuColor : "#F77F00"
    },
    {
      id:8,
      content: "Первое",
      image : MenuItemImg,
      menuColor : "#FF6F59"
    },
    {
      id:9,
      content: "Второе",
      image : MenuItemImg,
      menuColor : "#2EC4B6"
    },
    {
      id:10,
      content: "Стейк",
      image : MenuItemImg,
      menuColor : "#FFB700"
    },
    {
      id:11,
      content: "Турецкое",
      image : MenuItemImg,
      menuColor : "#D90368"
    },
    {
      id:12,
      content: "Сет",
      image : MenuItemImg,
      menuColor : "#8AC926"
    },
  ]
  useEffect(()=>{
    localStorage.setItem("menuId",menuId)
  },[menuId])
 


  return (
   <section className="py-30 h-screen ">
 {/* <div className="w-full fixed flex items-center justify-center header-auction top-21  h-8">
            <h2 className="text-white text-sm">use FAST4 code for 20% off</h2>
        </div> */}
     <div className="flex flex-col items-center justify-center gap-10">
     <BannerCarousel images={[Banner1, Banner2, Banner1, Banner2, Banner1, Banner2]} />


         <ul className="flex flex-wrap max-w-7xl gap-5 justify-center mt-10">
      {menuList.map(item=> <MenuItem key={item.id} item={item} setMenuId={setMenuId}/>)}
    </ul>
    </div>
  <Link to={"/menu"}>
  <Button extraClass="m-auto font-semibold py-3 px-8 mt-8">
    <p>Меню</p> <MoveRight className="w-5"/>
   </Button>
  </Link>
   </section>
  )
}

export default Home