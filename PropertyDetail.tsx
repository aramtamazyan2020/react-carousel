import React, {
  Dispatch,
  FunctionComponent,
  HTMLAttributes,
  SetStateAction,
  useMemo
} from "react"
import {
  Col,
  LoadingIndicator,
  Pagination,
  Row,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TableScrollWrapper,
  Tooltip
} from "@cc/ui"
import _ from "lodash"
import {useTranslation} from "react-i18next"
import mixpanel from "mixpanel-browser"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome"
import {faQuestionCircle} from "@fortawesome/pro-regular-svg-icons"
import ChartCard from "./ChartCard"
import Bar from "../../../Charts/Bar"
import {
  IGroupedStandsResponse,
  IProperty,
  IStand,
  IStandsData
} from "../../../../interfaces/scout"
import {AnalyticsEvent} from "../../../../interfaces/analytics"

interface IProps extends HTMLAttributes<HTMLDivElement> {
  scoutProperty: IProperty
  standDevelopmentClasses: IGroupedStandsResponse
  stands: IStandsData
  standsLoading?: boolean
  standsPage: number
  setStandsPage: Dispatch<SetStateAction<number>>
}

const PropertyDetail: FunctionComponent<IProps> = (props) => {
  const {
    scoutProperty,
    standDevelopmentClasses,
    stands,
    standsLoading,
    standsPage,
    setStandsPage
  } = props
  const {t} = useTranslation(["common", "scout"], {
    useSuspense: false
  })

  const standsPageCount = useMemo<number>(() => {
    return Math.ceil(stands.count / stands.pagination.limit)
  }, [stands])

  // const [imageUrl, setImageUrl] = useState<string>("")

  /*const images = [
    imageUrl,
    "https://picsum.photos/id/11/1280/720",
    "https://picsum.photos/id/12/1024/768",
    "https://picsum.photos/id/13/1024/720",
    "https://picsum.photos/id/14/800/600",
    "https://picsum.photos/id/15/1024/768",
    "https://picsum.photos/id/16/1024/720",
    "https://picsum.photos/id/17/800/600",
    "https://picsum.photos/id/18/800/600",
    "https://picsum.photos/id/19/800/600",
    "https://picsum.photos/id/20/800/600"
  ]*/

  /*useEffect(() => {
    const doFetch = async () => {
      try {
        const url = `${config.geoserver.static.url}/fi/wms?service=WMS&version=1.1.0&request=GetMap&layers=fi%3Aorto_pyramid, fi:stand_details_tornator&bbox=29.580850587256975, 63.06672383879288, 29.608423775356556, 63.075734568690876&width=512&height=512&srs=EPSG%3A4326&styles=&format=image%2Fpng&CQL_FILTER=TRUE=TRUE; stand_id=129153`
        const res = await fetch(url, {
          headers: {
            Authorization: config.geoserver.static.headers.authorization
          }
        })

        const image = await res.blob()
        const imageUrl = URL.createObjectURL(image)

        setImageUrl(imageUrl)
      } catch (err) {
        console.log(err)
      }
    }

    doFetch()
  }, [])*/

  const bonityData = useMemo<Record<string, any>[]>(() => {
    return [
      {
        label: t("common:species.pine"),
        value: scoutProperty.ccPineM3?.toFixed(0)
      },
      {
        label: t("common:species.spruce"),
        value: scoutProperty.ccSpruceM3?.toFixed(0)
      },
      {
        label: t("common:species.deciduous"),
        value: scoutProperty.ccDeciduousM3?.toFixed(0)
      }
    ]
  }, [scoutProperty, t])

  const logData = useMemo<Record<string, any>[]>(() => {
    return [
      {
        label: t("common:species.pine"),
        value: scoutProperty.ccPineTimberM3?.toFixed(0)
      },
      {
        label: t("common:species.spruce"),
        value: scoutProperty.ccSpruceTimberM3?.toFixed(0)
      },
      {
        label: t("common:species.deciduous"),
        value: scoutProperty.ccDeciduousTimberM3?.toFixed(0)
      }
    ]
  }, [scoutProperty, t])

  const fiberData = useMemo<Record<string, any>[]>(() => {
    return [
      {
        label: t("common:species.pine"),
        value: scoutProperty.ccPineFiberM3?.toFixed(0)
      },
      {
        label: t("common:species.spruce"),
        value: scoutProperty.ccSpruceFiberM3?.toFixed(0)
      },
      {
        label: t("common:species.deciduous"),
        value: scoutProperty.ccDeciduousFiberM3?.toFixed(0)
      }
    ]
  }, [scoutProperty, t])

  const developmentClassData = useMemo(() => {
    const {standsTotalArea, standGroups} = standDevelopmentClasses
    return _.map(
      standGroups,
      (developmentClassStands: {key: string; data: Array<IStand>}) => {
        const {key: developmentClass, data} = developmentClassStands
        const area = data.reduce((area, stand) => area + stand.standAreaHa, 0)

        return {
          label:
            developmentClass === "null"
              ? t("common:stand.mkDevelopmentClass.other")
              : developmentClass,
          value: ((area * 100) / standsTotalArea).toFixed(0)
        }
      }
    )
  }, [standDevelopmentClasses, t])

  // const standsTotalArea = useMemo<number>(() => {
  //   return stands.data.reduce((area, stand) => area + stand.standAreaHa, 0)
  // }, [stands])
  //
  // const standsBySoilType = useMemo(() => {
  //   return _.groupBy<IStand>(stands.data, "mkSoilType")
  // }, [stands])

  // const soilTypeData = useMemo(() => {
  //   return _.map(standsBySoilType, (soilTypeStands, soilType) => {
  //     const area = soilTypeStands.reduce(
  //       (area, stand) => area + stand.standAreaHa,
  //       0
  //     )
  //
  //     return {
  //       label:
  //       soilType === "null" ? t("common:stand.mkSoilType.other") : soilType,
  //       value: ((area * 100) / standsTotalArea).toFixed(2)
  //     }
  //   })
  // }, [standsBySoilType, standsTotalArea, t])

  const onStandsPageChange = (page: number) => {
    setStandsPage(page)

    mixpanel.track(AnalyticsEvent.scoutPropertyDetailPaginationChange, {page})
  }

  return (
    <>
      {/*<ImageGallery images={images} style={{marginBottom: "1.6rem"}} />*/}
      <Row>
        <Col
          xl={{size: 4}}
          lg={{size: 4}}
          md={{size: 12}}
          sm={{size: 12}}
          xs={{size: 12}}>
          <ChartCard>
            <Bar
              graphTitle={`${t("common:property.graph.totalVolume")} | ${t(
                "common:graph.total"
              )}: ${scoutProperty.ccTotalM3?.toFixed(0)} ${t(
                "common:unit.m3"
              )}`}
              height="20rem"
              data={bonityData}
              keys={["value"]}
              colors="#008916"
              indexBy="label"
              format={(v: string) => `${v} ${t("common:unit.m3")}`}
            />
          </ChartCard>
        </Col>
        <Col
          xl={{size: 4}}
          lg={{size: 4}}
          md={{size: 6}}
          sm={{size: 12}}
          xs={{size: 12}}>
          <ChartCard>
            <Bar
              graphTitle={`${t("common:property.graph.timberVolume")} | ${t(
                "common:graph.total"
              )}: ${scoutProperty.ccTotalTimberM3?.toFixed(0)} ${t(
                "common:unit.m3"
              )}`}
              height="20rem"
              data={logData}
              keys={["value"]}
              colors="#008916"
              indexBy="label"
              format={(v: string) => `${v} ${t("common:unit.m3")}`}
            />
          </ChartCard>
        </Col>
        <Col
          xl={{size: 4}}
          lg={{size: 4}}
          md={{size: 6}}
          sm={{size: 12}}
          xs={{size: 12}}>
          <ChartCard>
            <Bar
              graphTitle={`${t("common:property.graph.fiberVolume")} | ${t(
                "common:graph.total"
              )}: ${scoutProperty.ccTotalFiberM3?.toFixed(0)} ${t(
                "common:unit.m3"
              )}`}
              height="20rem"
              data={fiberData}
              keys={["value"]}
              colors="#008916"
              indexBy="label"
              format={(v: string) => `${v} ${t("common:unit.m3")}`}
            />
          </ChartCard>
        </Col>
      </Row>
      <Row>
        <Col
          xl={{size: 12}}
          lg={{size: 12}}
          md={{size: 12}}
          sm={{size: 12}}
          xs={{size: 12}}>
          <ChartCard>
            <Bar
              graphTitle={t("common:property.graph.mkDevelopmentClass")}
              height="20rem"
              data={developmentClassData}
              keys={["value"]}
              colors="#008916"
              indexBy="label"
              format={(v: string) => `${v}%`}
            />
          </ChartCard>
        </Col>
        {/*<Col*/}
        {/*  xl={{size: 6}}*/}
        {/*  lg={{size: 6}}*/}
        {/*  md={{size: 12}}*/}
        {/*  sm={{size: 12}}*/}
        {/*  xs={{size: 12}}>*/}
        {/*  <ChartCard>*/}
        {/*    <Bar*/}
        {/*      graphTitle={t("common:property.graph.mkSoilType")}*/}
        {/*      height="20rem"*/}
        {/*      data={soilTypeData}*/}
        {/*      keys={["value"]}*/}
        {/*      colors="#008916"*/}
        {/*      indexBy="label"*/}
        {/*      format={(v: string) => `${v}%`}*/}
        {/*    />*/}
        {/*  </ChartCard>*/}
        {/*</Col>*/}
      </Row>
      {standsLoading ? (
        <LoadingIndicator />
      ) : (
        <TableScrollWrapper style={{marginTop: "1.6rem"}}>
          <Table striped={true} freezeFirstColumn={true}>
            <TableHead>
              <TableRow>
                <TableHeadCell>{t("common:stand.mkStandNumber")}</TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.standAreaHa")} ({t("common:unit.ha")})
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.mkFertilityClass.label")}
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.ccMeanHeightM")} ({t("common:unit.m")})
                </TableHeadCell>
                <TableHeadCell>{t("common:stand.ccMainSpecies")}</TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.mkDevelopmentClass.label")}
                </TableHeadCell>

                <TableHeadCell>
                  {t("common:stand.ccPineTimberM3Ha")} ({t("common:unit.m3Ha")})
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.ccSpruceTimberM3Ha")} (
                  {t("common:unit.m3Ha")})
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.ccDeciduousTimberM3Ha")} (
                  {t("common:unit.m3Ha")})
                </TableHeadCell>

                <TableHeadCell>
                  {t("common:stand.ccPineFiberM3Ha")} ({t("common:unit.m3Ha")})
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.ccSpruceFiberM3Ha")} ({t("common:unit.m3Ha")}
                  )
                </TableHeadCell>
                <TableHeadCell>
                  {t("common:stand.ccDeciduousFiberM3Ha")} (
                  {t("common:unit.m3Ha")})
                </TableHeadCell>

                <TableHeadCell>
                  {t("common:stand.ccTotalM3Ha")} ({t("common:unit.m3Ha")})
                </TableHeadCell>

                <TableHeadCell>
                  <Tooltip
                    placement="top"
                    trigger="click"
                    content={t("common:tooltip.ccCarbonTCO2eq")}>
                    <span className="tooltip-helper">
                      <FontAwesomeIcon size="lg" icon={faQuestionCircle} />
                    </span>
                  </Tooltip>{" "}
                  {t("common:stand.ccCarbonTCO2eq")} ({t("common:unit.tCO2eq")})
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {_.orderBy(stands.data, (stand) =>
                _.toNumber(stand.mkStandNumber)
              ).map((stand) => (
                <TableRow key={stand.mkStandId}>
                  <TableHeadCell>{stand.mkStandNumber}</TableHeadCell>
                  <TableCell>{stand.standAreaHa.toFixed(2)}</TableCell>
                  <TableCell>{stand.mkFertilityClass || "-"}</TableCell>
                  <TableCell>{stand.ccMeanHeightM.toFixed(1)}</TableCell>
                  <TableCell>
                    {stand.ccMainSpecies && stand.ccMainSpecies !== "none"
                      ? t(`common:species.${stand.ccMainSpecies}`)
                      : "-"}
                  </TableCell>
                  <TableCell>{stand.mkDevelopmentClass || "-"}</TableCell>

                  <TableCell>
                    {stand.ccPineTimberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>
                  <TableCell>
                    {stand.ccSpruceTimberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>
                  <TableCell>
                    {stand.ccDeciduousTimberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>

                  <TableCell>
                    {stand.ccPineFiberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>
                  <TableCell>
                    {stand.ccSpruceFiberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>
                  <TableCell>
                    {stand.ccDeciduousFiberM3Ha?.toFixed(0) ?? "–"}
                  </TableCell>

                  <TableCell>{stand.ccTotalM3Ha?.toFixed(0) ?? "–"}</TableCell>
                  <TableCell>
                    {stand.ccCarbonTCO2eq?.toFixed(0) ?? "–"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScrollWrapper>
      )}
      {standsPageCount > 1 && (
        <div className="text-center" style={{marginTop: "1.6rem"}}>
          <Pagination
            currentPage={standsPage}
            pageCount={standsPageCount}
            onPageChange={onStandsPageChange}
            prevText={t("common:pagination.previous")}
            nextText={t("common:pagination.next")}
          />
        </div>
      )}
    </>
  )
}

export default PropertyDetail
