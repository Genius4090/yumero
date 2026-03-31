import { MapPin, Search } from "lucide-react"
import { WebsiteLogo } from "../assets/images"
import { Button } from "../components"

const Header = () => {

  
  return (
    <section className="fixed w-full">
        <div className="px-4 flex items-center py-5 justify-between">
        <div className="flex gap-8 items-center">
        <img src={WebsiteLogo} alt="" width={120} height={120}/>
        
       <div className="flex items-center ">
     <span className="bg-[#250036] text-[#FB00FF] rounded-full p-2">
     <MapPin />
     </span>
       <select className="text-[#FB00FF] px-2 font-semibold outline-none">
            <option value="0" className="">Ташкент</option>
        </select>
       </div>
        </div>

         <label className="flex px-4 bg-[#2b2a2a] w-[450px] gap-2 py-2 items-center justify-center rounded-full">
         <Search className="text-white w-4"/>
         <input type="text" placeholder="Search in Yumero" className="outline-none w-full placeholder:text-[#c4c4c4]  text-[#c4c4c4]"/>
         </label>
         <div className="flex">
            <Button extraClass="bg-transparent! text-white">
                <h2>Log in</h2>
            </Button>
            <Button extraClass="bg-[#250036]! text-[#FB00FF]!">
                <h2>Sign up</h2>
            </Button>
         </div>
        </div>
        <div className="w-full relative flex items-center justify-center header-auction h-8">
            <h2 className="text-white text-sm">use FAST4 code for 20% off</h2>
        </div>
        
    </section>
  )
}

export default Header