import { EventEmitter } from 'events'

class EventServiceClass {
  private static instance: EventServiceClass
  private emitter: EventEmitter

  private constructor() {
    this.emitter = new EventEmitter()
  }

  // Singleton pattern to ensure a single instance of the EventService
  public static getInstance(): EventServiceClass {
    if (!EventServiceClass.instance) {
      EventServiceClass.instance = new EventServiceClass()
    }
    return EventServiceClass.instance
  }

  // Subscribe to an event
  public on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener)
  }

  // subscribe to one event only
  public once(event: string, listener: (...args: any[]) => void): void {
    this.emitter.once(event, listener)
  }

  // Emit an event
  public emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args)
  }

  // Remove a listener for an event
  public off(event: string, listener: (...args: any[]) => void): void {
    this.emitter.off(event, listener)
  }
}

// Export the singleton instance
const EventService = EventServiceClass.getInstance()
export default EventService
