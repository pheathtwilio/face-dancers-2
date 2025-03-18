'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SessionTypes from '@/util/session-types'

interface SessionCheckerWrapperProps{
    children: React.ReactNode
}

export default function SessionCheckWrapper({children}: SessionCheckerWrapperProps){

    const pathname = usePathname()
    const router = useRouter()
    const [userName, setUserName] = useState<string>('')
    const searchParams = useRef<URLSearchParams | null>(null)

    useEffect(() => {

        const checkSession = async () => {
            
            const storedSession = localStorage.getItem('session')
            if(!storedSession){
                // no session go to verify
                router.replace(`/verify?username=${userName}`)
            }else{

                const jsonSession = JSON.parse(storedSession)
                const diff = Date.now() - jsonSession.data.createdAt 

                if(diff > (SessionTypes.ITEM_TTL*1000)){ // session is expired

                    localStorage.removeItem('session')
                    router.replace(`/verify?username=${userName}`)

                }

                // otherwise do nothing
            }
        }

        checkSession()

    }, [pathname, router])

    useEffect(() => {

        if(typeof window !== 'undefined'){
          searchParams.current = new URLSearchParams(window.location.search)
        }
      
        if(searchParams.current){
          const name = searchParams.current.get('username') || ''
          setUserName(name)
        }
    
      }, [searchParams])

    return <>{children}</>

}