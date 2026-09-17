
export interface menuListType {
    id:number,
    content:string,
    image:string,
    menuColor:string
  }



  
export interface addressType {
  id: string
  title: string
  address: string
  house: string
  apartment: string
  floor: string
  entrance: string
  comment: string
  lat: number
  lng: number
}

export interface productType {
      id:number,
      name:string,
      price: string,
      image: string,
      description: string,
      isPopular: boolean,
      categoryId: number,
      quantity: number,
}