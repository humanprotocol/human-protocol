import { sendAnalyticsEvent, user } from '@uniswap/analytics'
import { CustomUserProperties, getBrowser, SharedEventName } from '@uniswap/analytics-events'
import Footer from 'components/Footer/Footer'
import Loader from 'components/Icons/LoadingSpinner'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import VotePage from 'pages/Vote/VotePage'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import styled from 'styled-components/macro'
import { SpinnerSVG } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexRowNoWrap } from 'theme/styles'
import { Z_INDEX } from 'theme/zIndex'
import { retry } from 'utils/retry'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import NavBar from '../components/NavBar'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/components/DarkModeQueryParamReader'
import NotFound from './NotFound'

const isBannerVisible = process.env.REACT_APP_SHOW_TEST_BANNER === 'true'

const Vote = lazy(() => retry(() => import('./Vote')))

const HeaderWrapper = styled.div`
  ${flexRowNoWrap};
  background-color: ${({ theme }) => theme.background};
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.dropdown};
`

const BodyWrapper = styled.div<{ isBannerVisible: boolean }>`
  width: 100%;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding: ${({ isBannerVisible, theme }) =>
    isBannerVisible ? theme.navHeight * 2 + 'px 0 0 0' : theme.navHeight + 'px 0 0 0'};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    align-items: unset;
  }
`

const FooterWrapper = styled.div`
  ${flexRowNoWrap};
  width: 100%;
  margin-top: auto;
  z-index: ${Z_INDEX.dropdown};
  background-color: ${({ theme }) => theme.background};
`

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
`

// this is the same svg defined in assets/images/blue-loader.svg
// it is defined here because the remote asset may not have had time to load when this file is executing
const LazyLoadSpinner = () => (
  <SpinnerSVG width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M92 47C92 22.1472 71.8528 2 47 2C22.1472 2 2 22.1472 2 47C2 71.8528 22.1472 92 47 92"
      stroke="#320A8D"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SpinnerSVG>
)

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()

  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()

  useEffect(() => {
    // User properties *must* be set before sending corresponding event properties,
    // so that the event contains the correct and up-to-date user properties.
    user.set(CustomUserProperties.USER_AGENT, navigator.userAgent)
    user.set(CustomUserProperties.BROWSER, getBrowser())
    user.set(CustomUserProperties.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CustomUserProperties.SCREEN_RESOLUTION_WIDTH, window.screen.width)

    // Service Worker analytics
    const isServiceWorkerInstalled = Boolean(window.navigator.serviceWorker?.controller)
    const isServiceWorkerHit = Boolean((window as any).__isDocumentCached)
    const serviceWorkerProperty = isServiceWorkerInstalled ? (isServiceWorkerHit ? 'hit' : 'miss') : 'uninstalled'

    sendAnalyticsEvent(SharedEventName.APP_LOADED, { service_worker: serviceWorkerProperty })
    getCLS(({ delta }: Metric) => sendAnalyticsEvent(SharedEventName.WEB_VITALS, { cumulative_layout_shift: delta }))
    getFCP(({ delta }: Metric) => sendAnalyticsEvent(SharedEventName.WEB_VITALS, { first_contentful_paint_ms: delta }))
    getFID(({ delta }: Metric) => sendAnalyticsEvent(SharedEventName.WEB_VITALS, { first_input_delay_ms: delta }))
    getLCP(({ delta }: Metric) =>
      sendAnalyticsEvent(SharedEventName.WEB_VITALS, { largest_contentful_paint_ms: delta })
    )
  }, [])

  useEffect(() => {
    user.set(CustomUserProperties.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    user.set(CustomUserProperties.EXPERT_MODE, isExpertMode)
  }, [isExpertMode])

  return (
    <>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      <HeaderWrapper>
        <NavBar />
      </HeaderWrapper>
      <BodyWrapper isBannerVisible={isBannerVisible}>
        <Suspense fallback={<Loader />}>
          {isLoaded ? (
            <Routes>
              <Route
                path="/"
                element={
                  <Suspense
                    fallback={
                      <LoaderContainer>
                        <LazyLoadSpinner />
                      </LoaderContainer>
                    }
                  >
                    <Vote />
                  </Suspense>
                }
              />
              <Route path="/:governorIndex/:id" element={<VotePage />} />
              <Route path="/not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <Loader />
          )}
        </Suspense>
        <FooterWrapper>
          <Footer />
        </FooterWrapper>
      </BodyWrapper>
    </>
  )
}
