import React, {
  FunctionComponent,
  HTMLAttributes,
  ReactElement,
  useState
} from "react"
import {Pagination} from "../../index"
import GhostWrapper from "./GhostWrapper"
import CarouselItem from "./Item"
import PaginationWrapper from "./PaginationWrapper"
import CarouselWrapper from "./Wrapper"

interface IProps extends HTMLAttributes<HTMLDivElement> {
  slides: ReactElement[]
}

const Carousel: FunctionComponent<IProps> = (props) => {
  const {slides} = props

  const [currentSlide, setCurrentSlide] = useState<number>(1)

  const computedSlides = React.Children.map(slides, (slide, index) => {
    return (
      <CarouselItem isActive={index + 1 === currentSlide}>{slide}</CarouselItem>
    )
  })

  return (
    <div>
      <CarouselWrapper>
        {computedSlides}
        <GhostWrapper>{slides}</GhostWrapper>
      </CarouselWrapper>

      <PaginationWrapper>
        <Pagination
          variant="circle"
          hidePageNumber={true}
          currentPage={currentSlide}
          pageCount={slides.length}
          onPageChange={setCurrentSlide}
        />
      </PaginationWrapper>
    </div>
  )
}

Carousel.displayName = "Carousel"

export default Carousel
