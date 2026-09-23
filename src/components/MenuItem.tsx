import type { menuListType } from "@/@types"
import { Link } from "react-router-dom"


const MenuItem = ({item,setMenuId}:{item:menuListType,setMenuId:(id:number)=>void}) => {
 
  
  
  return (
    <Link to={"/menu"} onClick={()=> setMenuId(item.id)} className="block cursor-pointer duration-300 hover:-translate-y-2">
        {/* fills its grid cell on phones; the original fixed 160x120 tile from md */}
        <div className="flex aspect-4/3 w-full items-center justify-center rounded-lg md:aspect-auto md:h-30 md:w-40" style={{ backgroundColor: item.menuColor }}>
            <img src={item.image} alt="" draggable={false}/>
        </div>
        <p className="mt-1 truncate text-center">{item.content}</p>
        </Link>
  )
}

export default MenuItem