'use client'
import { useEffect, useRef, useState } from 'react'
import { Button, Container, Col, Row } from 'react-bootstrap'
import AvatarService from '@/services/avatar-service'
import VideoService from '@/services/video-service'
import { useRouter } from 'next/navigation'
import EventService from '@/services/event-service'
import { VideoEvents } from '@/util/video-types'
import AvatarEvents from '@/util/avatar-types'
import { connect, Room, LocalTrack, RemoteParticipant, RemoteVideoTrack, LocalParticipant, VideoTrack, Track, LocalTrackPublication } from 'twilio-video'


const VideoRoom: React.FC = () => {

  const avatarServiceRef = useRef<typeof AvatarService | null>(null)
  const videoServiceRef = useRef<typeof VideoService | null>(null)

  // const [isGoodbye, setIsGoodbye] = useState<boolean>(false)

  // const [room, setRoom] = useState<Room | null>(null)
  const remoteVideoRef = useRef<HTMLDivElement | null>(null)

  const router = useRouter()

    // Global Mounting    
    useEffect(() => {

      // register listeners
      EventService.on(VideoEvents.VIDEO_ROOM_REQUESTED, (room) => {
     
        if(!room) throw new Error('no video room available')

          console.log(room)


        room.localParticipant.tracks.forEach((publication: LocalTrackPublication) => {
          if(publication.track && publication.track.kind === 'video'){
            console.log("VIDEO TRACK FOUND")
            const videoElement = document.createElement('video')
            videoElement.autoplay = true
            videoElement.playsInline = true
            publication.track.attach(videoElement)
            remoteVideoRef.current!.innerHTML = ''
            remoteVideoRef.current!.appendChild(videoElement)
          }
        })

        // console.table(Array.from(room.))

        // room.participants.forEach((participant: RemoteParticipant) => {

        //   console.log(`PARTICIPANT ${participant}`)


        //   participant.tracks.forEach((publication) => {
        //     if(publication.isSubscribed){
        //       const track = publication.track as RemoteVideoTrack
        //       if(track.kind === 'video' && remoteVideoRef.current){
        //         const videoElement = document.createElement('video')
        //         videoElement.autoplay = true
        //         videoElement.playsInline = true
        //         track.attach(videoElement)
        //         remoteVideoRef.current.innerHTML = ''
        //         remoteVideoRef.current.appendChild(videoElement)
        //       }
        //     }
        //   })
        // })
        // get the audio tracks etc
      })

      // get the room and the video/audio tracks and show on this page
      EventService.emit(VideoEvents.VIDEO_REQUEST_ROOM)


      // attach this user to room

      



      // EventService.emit(VideoEvents.)

      return () => {

        // avatarServiceRef.current?.endSession() 
        // videoServiceRef.current?.endRoom()
        console.log('unmounting the Video Room')
        EventService.emit(AvatarEvents.AVATAR_END_SESSION)
        EventService.emit(VideoEvents.VIDEO_END_SESSION)
        
      }
        
    }, [])


    const endSession = async () => {

      // if(avatarServiceRef.current && videoServiceRef.current){
      //   console.log('calling end session')
      //   await avatarServiceRef.current.endSession()
      //   await videoServiceRef.current.endRoom()
      // }

      // then reroute to goodbye page
      router.push('/goodbye')
  }
   
    return (
      <div className="video-room-container">
        <Container className="mt-5">
          <h1 className="text-center">Avatar Video Room</h1>
          <Row className="justify-content-center">
            <Col md={6}>
              <div ref={remoteVideoRef} style={{ width: '100%', height: '400px', backgroundColor: '#000' }}>
                <p className="text-white text-center">Waiting for avatar...</p>
              </div>
              <Button variant="secondary" onClick={endSession} className="w-100 mt-3">
                End Session
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    )
}

export default VideoRoom
