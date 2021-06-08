import styled from "styled-components"

const GhostWrapper = styled.div`
  align-items: baseline;
  display: flex;
  overflow: hidden;
  visibility: hidden;

  & > * {
    flex-grow: 0;
    flex-shrink: 0;
  }
`

export default GhostWrapper
