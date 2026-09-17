import type { productType } from "@/@types";
import { SearchBar } from "@/components";
import FoodCard from "@/components/FoodCard";
import { useState } from "react";

const Menu = () => {
  const menuList:{id:number,content:string,isActive:boolean}[] = [
    {
      id:0,
      content: "Популярное",
      isActive:true
    },
    {
      id:1,
      content: "Лаваш",
      isActive:false
      
    },
    {
      id:2,
      content: "Бургеры",
      isActive:false

    },
    {
      id:3,
      content: "Пиццы",
      isActive:false

    },
    {
      id:4,
      content: "Хот-доги",
      isActive:false

    },
    {
      id:5,
      content: "Салаты",
      isActive:false

    },
    {
      id:6,
      content: "Десерты",
      isActive:false

    },
    {
      id:7,
      content: "Напитки",
      isActive:false

    },
    {
      id:8,
      content: "Первое",
      isActive:false

    },
    {
      id:9,
      content: "Второе",
      isActive:false

    },
    {
      id:10,
      content: "Стейк",
      isActive:false

    },
    {
      id:11,
      content: "Турецкое",
      isActive:false

    },
    {
      id:12,
      content: "Сет",
      isActive:false
    },
  ]
  
  const productList:productType[] = [
    {
      id:1,
      name:"Чизбургер",
      price: "24",
      image: "",
      description: "",
      isPopular:false,
      categoryId:1,
      quantity: 0,
    },
    {
      id:2,
      name:"Чизбургер",
      price: "24",
      image: "",
      description: "",
      isPopular:false,
      categoryId:1,
      quantity: 0,
    },
    {
      id:3,
      name:"Чизбургер",
      price: "24",
      image: "",
      description: "",
      isPopular:false,
      categoryId:1,
      quantity: 0,
    }
  ]

  const [activeId, setActiveId] = useState<number>(
    () => Number(localStorage.getItem("menuId")) || 0
  ); // first is active by default

  const handleClick = (id: number) => {
    setActiveId(id); // set clicked item as active
  };

  return (
    <section className="py-30 h-600">
     
    <ul className="flex flex-wrap gap-3 justify-center py-4 border-t border-b border-[#333333]">
   {menuList.map(item => 
   <button onClick={() => handleClick(item.id)} className={`cursor-pointer py-1 px-2 border border-transparent  rounded-lg tracking-wider ${item.id == activeId && " border-[#77FF00]!"}`} key={item.id}>{item.content}</button>)}
   
    </ul>
    
  <div className="containers">

  <div className="w-full flex justify-between ">
    <SearchBar extraClass="w-[300px]!"/>
    </div>

    <h2>Бургеры</h2>
    <ul className="flex flex-wrap items-center">
      {productList.map(item => <FoodCard key={item.id}/>)}
      
    </ul>

  </div>
    </section>
  )
}

export default Menu