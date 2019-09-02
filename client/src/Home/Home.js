import React, { useCallback, useEffect, useRef, useState } from 'react'
import { InlineLoading } from 'carbon-components-react'

import styles from './Home.module.css'
import windowDark from './window-dark.png'
import video from './tmp.webm'
import video2 from './tmp.mp4'
import { useGoogleAnalytics } from 'googleAnalyticsHook'

// ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 -pass 1 -an -f webm /dev/null && \
// ffmpeg -i input.mp4 -c:v libvpx-vp9 -b:v 0 -crf 30 -pass 2 -c:a libopus output.webm
const Home = () => {
  const [loading, setLoading] = useState(false)

  useGoogleAnalytics('home')

  const handleClick = useCallback(() => {
    window.location.href = '/auth/login'
    setLoading(true)
  }, [])

  const videoRef = useRef(null)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play()
    }
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleBar}>
        <div className={styles.title}>
          <span className={styles.titlePrefix}>IBM</span>&nbsp;&nbsp;Cloud
          Annotations
        </div>
        <a
          href="https://github.com/cloud-annotations"
          target="_blank"
          rel="noopener noreferrer"
        >
          Docs
        </a>
        <a
          href="https://github.com/cloud-annotations"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <div className={styles.button} onClick={handleClick}>
          Log in
        </div>
      </div>
      <div className={styles.leftWrapper}>
        <div className={styles.bigText}>Cloud Annotations</div>
        <div className={styles.subText}>
          Something something lorem epson sid alor mit Something something lorem
          epson sid alor mit Something something lorem epson sid alor mit
          Something something lorem epson sid alor mit
        </div>
        <div className={styles.buttonsWrapper}>
          {loading ? (
            <div className={styles.loading}>
              <InlineLoading description="Loading" success={false} />
            </div>
          ) : (
            <div className={styles.button} onClick={handleClick}>
              Continue with IBM Cloud
            </div>
          )}
          <div className={styles.button}>Documentation</div>
        </div>
      </div>
      <div className={styles.videoWrapper}>
        <img className={styles.image} src={windowDark} alt="" />
        <video
          ref={videoRef}
          className={styles.video}
          autoplay
          loop
          muted
          preload="auto"
        >
          <source src={video} type="video/webm" />
          <source src={video2} type="video/mp4" />
        </video>
      </div>
    </div>
  )
}

export default Home
