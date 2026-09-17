import { Search } from 'lucide-react'

const SearchBar = ({extraClass}:{extraClass?:string}) => {
  return (
    <label className={`flex px-4 bg-[#2b2a2a] w-[500px] gap-2 py-3 items-center justify-center rounded-full mt-10 ${extraClass}`}>
    <Search className="text-white w-4"/>
    <input type="text" placeholder="Search in Yumero" className="outline-none w-full placeholder:text-[#c4c4c4]  text-[#c4c4c4]"/>
    </label>
  )

}

export default SearchBar