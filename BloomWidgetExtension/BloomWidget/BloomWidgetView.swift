import SwiftUI
import WidgetKit

struct BloomWidgetView: View {
    let entry: BloomEntry
    @Environment(\.widgetFamily) private var family

    private var gradTop: Color {
        let c = entry.state.gradientTop
        return Color(red: c.r, green: c.g, blue: c.b)
    }

    private var gradBottom: Color {
        let c = entry.state.gradientBottom
        return Color(red: c.r, green: c.g, blue: c.b)
    }

    var body: some View {
        // Tapping the widget opens Bloom via the bloom:// URL scheme
        Link(destination: URL(string: "bloom://open")!) {
            ZStack {
                // Background gradient matching the clock pill
                LinearGradient(
                    colors: [gradTop, gradBottom],
                    startPoint: .top,
                    endPoint: .bottom
                )

                HStack(spacing: family == .systemSmall ? 8 : 16) {
                    // Time + state label
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.date, style: .time)
                            .font(.system(
                                size: family == .systemSmall ? 28 : 38,
                                weight: .bold,
                                design: .rounded
                            ))
                            .foregroundColor(.white)
                            .shadow(color: .white.opacity(0.6), radius: 8, x: -4, y: -4)
                            .shadow(color: .white.opacity(0.4), radius: 10, x: 4, y: 4)

                        Text(entry.state.label)
                            .font(.system(
                                size: family == .systemSmall ? 11 : 14,
                                weight: .medium
                            ))
                            .foregroundColor(.white.opacity(0.75))
                    }

                    Spacer()

                    // Celestial icon
                    Image(systemName: entry.state.celestialSymbol)
                        .resizable()
                        .scaledToFit()
                        .frame(
                            width: family == .systemSmall ? 36 : 52,
                            height: family == .systemSmall ? 36 : 52
                        )
                        .foregroundStyle(
                            entry.state == .night
                                ? Color.white.opacity(0.9)
                                : Color(red: 1.0, green: 0.788, blue: 0.263) // golden sun
                        )
                        .shadow(
                            color: (entry.state == .night ? Color.white : Color.yellow).opacity(0.5),
                            radius: 12
                        )
                }
                .padding(family == .systemSmall ? 12 : 16)

                // Subtle inset shadow overlay (pill depth effect)
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
                    .padding(1)
            }
        }
        .containerBackground(for: .widget) {
            Color(red: 0.004, green: 0.071, blue: 0.137) // dark navy fallback
        }
    }
}

#Preview(as: .systemSmall) {
    BloomWidget()
} timeline: {
    BloomEntry(date: .now, state: .day)
    BloomEntry(date: .now, state: .night)
}
