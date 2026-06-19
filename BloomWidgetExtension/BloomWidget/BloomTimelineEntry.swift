import WidgetKit
import Foundation

enum ClockState {
    case sunrise, day, sunset, night

    /// Linear gradient start colour
    var gradientTop: (r: Double, g: Double, b: Double) {
        switch self {
        case .sunrise: return (1.00, 0.792, 0.263) // #FFCA43
        case .day:     return (0.263, 0.667, 1.00)  // #43AAFF
        case .sunset:  return (1.00, 0.792, 0.263)  // #FFCA43
        case .night:   return (0.004, 0.071, 0.137) // #011223
        }
    }

    /// Linear gradient end colour
    var gradientBottom: (r: Double, g: Double, b: Double) {
        switch self {
        case .sunrise: return (0.922, 0.612, 0.208) // #EB9C35
        case .day:     return (0.306, 0.604, 0.851) // #4E9AD9
        case .sunset:  return (0.922, 0.612, 0.208) // #EB9C35
        case .night:   return (0.004, 0.071, 0.137) // #011223
        }
    }

    var label: String {
        switch self {
        case .sunrise: return "Sunrise"
        case .day:     return "Day"
        case .sunset:  return "Sunset"
        case .night:   return "Night"
        }
    }

    var celestialSymbol: String {
        switch self {
        case .sunrise, .day: return "sun.max.fill"
        case .sunset:        return "sun.horizon.fill"
        case .night:         return "moon.stars.fill"
        }
    }
}

func clockState(for date: Date) -> ClockState {
    let c = Calendar.current
    let total = c.component(.hour, from: date) * 60 + c.component(.minute, from: date)
    switch total {
    case 300..<480:  return .sunrise
    case 480..<1080: return .day
    case 1080..<1200: return .sunset
    default:         return .night
    }
}

struct BloomEntry: TimelineEntry {
    let date: Date
    let state: ClockState
}

struct BloomTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> BloomEntry {
        BloomEntry(date: Date(), state: .day)
    }

    func getSnapshot(in context: Context, completion: @escaping (BloomEntry) -> Void) {
        completion(BloomEntry(date: Date(), state: clockState(for: Date())))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BloomEntry>) -> Void) {
        let now = Date()
        let entry = BloomEntry(date: now, state: clockState(for: now))
        // Refresh every minute so time and state stay current
        let nextMinute = Calendar.current.nextDate(
            after: now,
            matching: DateComponents(second: 0),
            matchingPolicy: .nextTime
        ) ?? now.addingTimeInterval(60)
        completion(Timeline(entries: [entry], policy: .after(nextMinute)))
    }
}
