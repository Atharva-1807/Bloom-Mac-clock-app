import WidgetKit
import SwiftUI

@main
struct BloomWidgetBundle: WidgetBundle {
    var body: some Widget {
        BloomWidget()
    }
}

struct BloomWidget: Widget {
    let kind: String = "BloomWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BloomTimelineProvider()) { entry in
            BloomWidgetView(entry: entry)
        }
        .configurationDisplayName("Bloom")
        .description("Your skeuomorphic clock — sunrise, day, sunset & night.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
