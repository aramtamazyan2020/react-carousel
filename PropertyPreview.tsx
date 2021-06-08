import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
  useMemo,
  useEffect
} from "react"
import {
  Row,
  Col,
  Dropdown,
  DropdownMenuItem,
  Button,
  LoadingIndicator,
  Modal,
  ToastContent,
  Tooltip
} from "@cc/ui"
import {faTimes} from "@fortawesome/pro-light-svg-icons"
import {useLazyQuery, useMutation, useReactiveVar} from "@apollo/client"
import {InteractiveMapProps} from "react-map-gl"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {useTranslation} from "react-i18next"
import {useToasts} from "react-toast-notifications"
import styled from "styled-components"
import {
  faFileExcel,
  faFileCsv,
  faQuestionCircle
} from "@fortawesome/pro-regular-svg-icons"
import {useHistory, useLocation} from "react-router"
import {Bounds} from "viewport-mercator-project"
import mixpanel from "mixpanel-browser"
import {useAuth0} from "@auth0/auth0-react"
import {
  basketItemsVar,
  setBasketItems
} from "../../../../services/network/graphql/localState/basket"
import PropertyCard from "../PropertyCard"
import {
  QUERY_PROPERTY_PREVIEW,
  QUERY_PROPERTY_DETAILS,
  QUERY_PROPERTY_BBOX
} from "../../../../services/network/graphql/property/queries"
import PropertyDetail from "../PropertyDetail"
import {QUERY_STANDS} from "../../../../services/network/graphql/stand/queries"
import {MUTATION_SCOUT_PURCHASE} from "../../../../services/network/graphql/purchase/mutations"
import {QUERY_PROFILE} from "../../../../services/network/graphql/user/queries"
import {getGqlError} from "../../../../utils/error"
import {getZoomBboxViewport} from "../../../../utils/map"
import {AnalyticsEvent} from "../../../../interfaces/analytics"
import download from "../../../../utils/download"
import config from "../../../../config"

const ActionButtonsWrapper = styled.div`
  align-items: flex-start;
  display: flex;
  justify-content: flex-end;
  margin: 0.8rem 1.6rem 0 1.6rem;

  @media (max-width: ${({theme}) => theme.grid.breakpoints.lg}) {
    margin-right: 0;
  }
`

interface IProps {
  parcelId: string
  parcelBbox: Bounds | null
  setParcelBbox: (parcelBbox: Bounds | null) => void
  showData?: boolean
  setShowData?: Dispatch<SetStateAction<boolean>>
  isDataOpened?: boolean
  setIsDataOpened?: Dispatch<SetStateAction<boolean>>
  updateMapViewport: (newViewport: Partial<InteractiveMapProps>) => void
  onClose?: () => void
  showStatus?: boolean
  showPurchaseButton?: boolean
  onPurchased?: () => void
  triggerZoomToBbox?: boolean
  setTriggerZoomToBbox?: (shouldTrigger: boolean) => void
}

const PropertyPreview: FunctionComponent<IProps> = (props) => {
  const {
    parcelId,
    parcelBbox,
    setParcelBbox,
    updateMapViewport,
    isDataOpened,
    setIsDataOpened,
    onClose,
    showStatus,
    onPurchased,
    showPurchaseButton,
    triggerZoomToBbox,
    setTriggerZoomToBbox
  } = props

  const history = useHistory()
  const location = useLocation()

  const {t} = useTranslation(["common", "scout"], {
    useSuspense: false
  })
  const {addToast} = useToasts()

  const [standsPage, setStandsPage] = useState<number>(1)

  const basketItems = useReactiveVar(basketItemsVar)
  const [loadBbox, {data: bboxData, loading: bboxDataLoading}] = useLazyQuery(
    QUERY_PROPERTY_BBOX,
    {
      onCompleted: (data) => {
        setParcelBbox(data.propertyBbox.bbox)
      }
    }
  )
  const [
    loadPreviewData,
    {loading: previewDataLoading, error: previewDataError, data: previewData}
  ] = useLazyQuery(QUERY_PROPERTY_PREVIEW, {
    variables: {parcelId},
    onCompleted(data: any) {
      if (
        location.pathname.includes("/scout/properties") &&
        !data.property.isPurchased
      ) {
        history.push(`/scout/search?propertyId=${parcelId}`)
      }
    }
  })

  const [
    loadDetailsData,
    {loading: detailsDataLoading, error: detailsDataError, data: detailsData}
  ] = useLazyQuery(QUERY_PROPERTY_DETAILS, {
    variables: {parcelId: parcelId}
  })

  const [
    loadStandsData,
    {loading: standsDataLoading, error: standsDataError, data: standsData}
  ] = useLazyQuery(QUERY_STANDS, {
    variables: {
      parcelId,
      pagination: {
        page: standsPage
      }
    }
  })

  const [
    purchase,
    {loading: purchaseLoading, error: purchaseError, client}
  ] = useMutation(MUTATION_SCOUT_PURCHASE, {awaitRefetchQueries: true})

  const [purchaseModalVisible, setPurchaseModalVisible] = useState<boolean>(
    false
  )
  const isInBasket = useMemo<boolean>(() => {
    return basketItems.parcelIds.includes(parcelId)
  }, [basketItems, parcelId])
  const propertyStatus = useMemo(() => {
    if (
      previewData &&
      previewData.property &&
      previewData.property.isPurchased
    ) {
      return t("common:property.status.purchased")
    }

    if (isInBasket) {
      return t("common:property.status.inBasket")
    }

    return t("common:property.status.available")
  }, [previewData, isInBasket, t])

  const onShowDataClick = () => {
    if (setIsDataOpened) {
      setIsDataOpened(!isDataOpened)

      if (!isDataOpened) {
        mixpanel.track(AnalyticsEvent.scoutPropertyDetailOpen)
      } else {
        mixpanel.track(AnalyticsEvent.scoutPropertyDetailClose)
      }
    }
  }

  const onClosePreview = () => {
    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewClose, {parcelId})

    if (onClose) {
      onClose()
    }

    setParcelBbox(null)
  }

  const isLoading = previewDataLoading || detailsDataLoading || bboxDataLoading
  const shouldShowPreview =
    !previewDataLoading &&
    !previewDataError &&
    previewData &&
    (!previewData.property?.isPurchased ||
      (!detailsDataLoading && !detailsDataError && detailsData))

  const addToBasket = () => {
    setBasketItems({
      ...basketItemsVar,
      parcelIds: [...basketItems.parcelIds, parcelId]
    })

    addToast(
      <ToastContent
        title={t("common:toast.scout.basket.addItem.success", {id: parcelId})}
      />,
      {
        appearance: "success"
      }
    )

    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewAddToBasket, {parcelId})

    onClosePreview()
  }

  const openPurchaseModal = () => {
    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewPurchaseNowOpen, {
      parcelId
    })
    setPurchaseModalVisible(true)
  }

  const onCancelPurchase = () => {
    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewPurchaseNowClose, {
      parcelId
    })
    setPurchaseModalVisible(false)
  }

  const onProceedPurchase = async () => {
    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewPurchaseNowClick, {
      parcelId
    })

    try {
      await purchase({
        variables: {parcelIds: [parcelId]},
        refetchQueries: [
          {
            query: QUERY_PROFILE
          }
        ]
      })

      client.cache.evict({fieldName: "organizationProperties"})

      setBasketItems({
        ...basketItems,
        parcelIds: basketItems.parcelIds.filter((id) => id !== parcelId)
      })

      setPurchaseModalVisible(false)
      onClosePreview()

      client.cache.evict({fieldName: "property"})

      mixpanel.track(AnalyticsEvent.scoutPropertyPreviewPurchaseNowSuccess, {
        parcelId
      })

      if (onPurchased) {
        onPurchased()
      }
    } catch (err) {
      // @TODO: log error?
    }
  }

  const {getAccessTokenSilently} = useAuth0()

  const downloadCSV = async () => {
    const accessToken = await getAccessTokenSilently({
      audience: config.auth0.defaultAudience
    })

    download(
      `scout/property/${parcelId}/export?type=csv&accessToken=${accessToken}`,
      `property_${previewData.property.cadastralId}_${previewData.property.parcelId}_stands_data.csv`
    )

    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewExportCsv, {parcelId})
  }

  const downloadXLSX = async () => {
    const accessToken = await getAccessTokenSilently({
      audience: config.auth0.defaultAudience
    })

    download(
      `scout/property/${parcelId}/export?type=xlsx&accessToken=${accessToken}`,
      `property_${previewData.property.cadastralId}_${previewData.property.parcelId}.xlsx`
    )

    mixpanel.track(AnalyticsEvent.scoutPropertyPreviewExportXlsx, {parcelId})
  }

  useEffect(() => {
    if (parcelId) {
      mixpanel.track(AnalyticsEvent.scoutPropertyPreviewOpen, {parcelId})
    }
  }, [parcelId])

  useEffect(() => {
    setStandsPage(1)

    if (!parcelBbox) {
      loadBbox({variables: {parcelId}})
    }
  }, [parcelId, parcelBbox, loadBbox])

  useEffect(() => {
    if (bboxData && bboxData.propertyBbox && bboxData.propertyBbox.bbox) {
      updateMapViewport(getZoomBboxViewport(bboxData.propertyBbox.bbox))
    }
  }, [bboxData, updateMapViewport])

  useEffect(() => {
    if (!isDataOpened) {
      loadPreviewData({
        variables: {parcelId}
      })

      if (previewData?.property?.isPurchased) {
        loadDetailsData({
          variables: {parcelId}
        })
      }
    }

    if (isDataOpened) {
      loadPreviewData({
        variables: {parcelId}
      })
      loadDetailsData({
        variables: {parcelId}
      })
      loadStandsData({
        variables: {
          parcelId,
          pagination: {
            page: standsPage
          }
        }
      })
    }
  }, [
    previewData,
    parcelId,
    isDataOpened,
    loadPreviewData,
    loadDetailsData,
    loadStandsData,
    standsPage
  ])

  useEffect(() => {
    if (!purchaseLoading && purchaseError) {
      const errorMessage = t(getGqlError(purchaseError.graphQLErrors))

      addToast(<ToastContent title={errorMessage} />, {
        appearance: "error"
      })
    }
  }, [purchaseLoading, purchaseError, t, addToast])

  useEffect(() => {
    if (triggerZoomToBbox && parcelBbox) {
      updateMapViewport(getZoomBboxViewport(parcelBbox))

      if (setTriggerZoomToBbox) {
        setTriggerZoomToBbox(false)
      }
    }
  }, [triggerZoomToBbox, setTriggerZoomToBbox, parcelBbox, updateMapViewport])

  return (
    <PropertyCard isDataOpened={isDataOpened}>
      {shouldShowPreview && (
        <Row style={{marginBottom: "1.6rem", marginRight: "3.2rem"}}>
          <Col style={{minWidth: "15rem"}}>
            <p>
              <small className="xs-font">
                {t("common:property.cadastralId")}
              </small>
            </p>
            <p>
              <b>{previewData.property.cadastralId}</b>
            </p>
          </Col>
          <Col>
            <p>
              <small className="xs-font">{t("common:property.parcelId")}</small>
            </p>
            <p>
              <b>{previewData.property.parcelId}</b>
            </p>
          </Col>
          <Col>
            <p>
              <small className="xs-font">
                {t("common:property.propertyAreaHa")}
              </small>
            </p>
            <p>
              {previewData.property.propertyAreaHa.toFixed(2)}{" "}
              {t("common:unit.ha")}
            </p>
          </Col>
          <Col>
            <p>
              <small className="xs-font">
                {t("common:property.forestAreaHa")}
              </small>
            </p>
            <p>
              {previewData.property.forestAreaHa.toFixed(2)}{" "}
              {t("common:unit.ha")}
            </p>
          </Col>
          {detailsData?.property?.isPurchased && (
            <Col>
              <p>
                <small>
                  {t("common:property.ccCarbonTCO2eq")}{" "}
                  <Tooltip
                    placement="top"
                    trigger="click"
                    content={t("common:tooltip.ccCarbonTCO2eq")}>
                    <span className="tooltip-helper">
                      <FontAwesomeIcon size="lg" icon={faQuestionCircle} />
                    </span>
                  </Tooltip>
                </small>
              </p>
              <p>
                {detailsData.property.ccCarbonTCO2eq.toFixed(0)}{" "}
                {t("common:unit.tCO2eq")}
              </p>
            </Col>
          )}
          {showStatus && (
            <Col>
              <p>
                <small className="xs-font">
                  {t("common:property.status.label")}
                </small>
              </p>
              <p>{propertyStatus}</p>
            </Col>
          )}
          <Col
            style={{minWidth: "24rem"}}
            xs={{size: 12}}
            sm={{size: 12}}
            md={{size: 12}}>
            <ActionButtonsWrapper>
              {previewData.property.isPurchased ? (
                <>
                  <Dropdown title={t("common:property.action.export.title")}>
                    <DropdownMenuItem onClick={downloadCSV}>
                      <FontAwesomeIcon icon={faFileCsv} />{" "}
                      {t("common:property.action.export.csv")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadXLSX}>
                      <FontAwesomeIcon icon={faFileExcel} />{" "}
                      {t("common:property.action.export.xlsx")}
                    </DropdownMenuItem>
                  </Dropdown>
                  <Button
                    className="hidden-sm-down"
                    variant="outlined"
                    onClick={onShowDataClick}
                    style={{marginLeft: "1.6rem"}}>
                    {isDataOpened
                      ? t("common:action.property.close")
                      : t("common:action.property.open")}
                  </Button>
                  <Button
                    className="hidden-md-up"
                    onClick={onShowDataClick}
                    style={{marginLeft: "1.6rem"}}>
                    {isDataOpened
                      ? t("common:action.property.close")
                      : t("common:action.property.open")}
                  </Button>
                </>
              ) : (
                showPurchaseButton && (
                  <Dropdown title={t("common:action.property.purchase")}>
                    {!isInBasket && (
                      <DropdownMenuItem onClick={addToBasket}>
                        {t("common:action.property.addToBasket")}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={openPurchaseModal}>
                      {t("common:action.property.purchaseNow")}
                    </DropdownMenuItem>
                  </Dropdown>
                )
              )}
            </ActionButtonsWrapper>
          </Col>
        </Row>
      )}

      <Button className="close-button" variant="text" onClick={onClosePreview}>
        <FontAwesomeIcon icon={faTimes} />
      </Button>

      {isLoading && <LoadingIndicator />}

      {isDataOpened &&
        !detailsDataLoading &&
        !standsDataError &&
        !detailsDataError &&
        detailsData && (
          <PropertyDetail
            scoutProperty={detailsData.property}
            standDevelopmentClasses={detailsData.standsByDevelopmentClass}
            stands={
              standsData?.stands || {
                count: 0,
                pagination: {
                  limit: 10,
                  page: 1
                },
                data: []
              }
            }
            standsLoading={standsDataLoading}
            standsPage={standsPage}
            setStandsPage={setStandsPage}
          />
        )}

      {!previewDataLoading && !previewDataError && previewData && (
        <Modal
          visible={purchaseModalVisible}
          setIsVisible={setPurchaseModalVisible}>
          <h5 style={{marginBottom: "1.6rem"}}>
            {t("scout:search.modal.purchaseNow.title")}
          </h5>
          <Row>
            <Col style={{minWidth: "16rem"}}>
              <p>
                <small className="xs-font">
                  {t("common:property.cadastralId")}
                </small>
              </p>
              <p>
                <b>{previewData.property.cadastralId}</b>
              </p>
            </Col>
            <Col>
              <p>
                <small className="text-dimmed xs-font">
                  {t("common:property.parcelId")}
                </small>
              </p>
              <p>
                <b>{previewData.property.parcelId}</b>
              </p>
            </Col>
            <Col>
              <p>
                <small className="xs-font">
                  {" "}
                  {t("common:property.forestAreaHa")}
                </small>
              </p>
              <p>
                {previewData.property.forestAreaHa.toFixed(2)}{" "}
                {t("common:unit.ha")}
              </p>
            </Col>
          </Row>
          <hr />
          <p>
            <small className="xs-font text-dimmed">
              {t("scout:search.modal.purchaseNow.totalArea")}
            </small>
          </p>
          <p>
            {previewData.property.forestAreaHa.toFixed(2)} {t("common:unit.ha")}
          </p>
          <p>
            <small className="xs-font text-dimmed">
              {t("scout:search.modal.purchaseNow.totalProperty")}
            </small>
          </p>
          <p style={{marginBottom: "1.6rem"}}>
            {t("scout:search.modal.purchaseNow.totalPropertyCount", {count: 1})}
          </p>
          <Button
            style={{marginRight: "2.4rem"}}
            onClick={onProceedPurchase}
            isDisabled={purchaseLoading}>
            {t("scout:search.modal.purchaseNow.action.buy")}
          </Button>
          <Button variant="outlined" onClick={onCancelPurchase}>
            {t("scout:search.modal.purchaseNow.action.cancel")}
          </Button>
        </Modal>
      )}
    </PropertyCard>
  )
}

PropertyPreview.defaultProps = {
  showStatus: false,
  showPurchaseButton: false
}

export default PropertyPreview
