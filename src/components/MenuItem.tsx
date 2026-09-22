import type { menuListType } from "@/@types"
import { Link } from "react-router-dom"


const MenuItem = ({item,setMenuId}:{item:menuListType,setMenuId:(id:number)=>void}) => {
 
  
  
  return (
    <Link to={"/menu"} onClick={()=> setMenuId(item.id)} className="cursor-pointer hover:-translate-y-2 duration-300">
        <div className="w-[160px] h-[120px] rounded-lg flex items-center justify-center" style={{ backgroundColor: item.menuColor }}>
            <img src={item.image} alt=""/>
        </div>
        <p className="text-center mt-1">{item.content}</p>
        </Link>
  )
}

export default MenuItem