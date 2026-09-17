import GooeyNav from "@/components/GooeyNav";


const MenuBar = () => {
  const items = [
    { label: "Home", href: "/home" },
    { label: "Menu", href: "/menu" },
    { label: "Contact", href: "/contact" },  
  ];
  
  return (
<GooeyNav
      items={items}
      particleCount={15}
      particleDistances={[90, 10]}
      particleR={100}
      initialActiveIndex={0}
      animationTime={600}
      timeVariance={300}
      colors={[1, 2, 3, 1, 2, 3, 1, 4]}
    />
    
  )
}

export default MenuBar