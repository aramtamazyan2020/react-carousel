import {HTMLAttributes} from "react"
import styled, {css, StyledProps} from "styled-components"

interface IProps extends HTMLAttributes<HTMLDivElement> {
  isActive?: boolean
}

const activeMixin = css<StyledProps<IProps>>`
  opacity: 1;
  z-index: 1;
`

const CarouselItem = styled.div<IProps>`
  left: 50%;
  opacity: 0;
  position: absolute;
  transform: translateX(-50%);
  transition: opacity 0.2s ease-in-out;
  z-index: -1;

  ${({isActive}) => (isActive ? activeMixin : "")}
`

export default CarouselItem
