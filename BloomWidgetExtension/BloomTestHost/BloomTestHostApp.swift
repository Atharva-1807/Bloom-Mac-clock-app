import SwiftUI

@main
struct BloomTestHostApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "clock.badge.checkmark")
                .font(.system(size: 48))
                .foregroundStyle(.blue)

            Text("Bloom Widget Test Host")
                .font(.title2.bold())

            Text("The BloomWidget extension is now registered on this Mac.\nRight-click your desktop → Edit Widgets → search "Bloom".")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .frame(maxWidth: 340)

            Button("Open Widget Picker") {
                // Open the Notification Centre widget editor directly
                let url = URL(string: "x-apple.systempreferences:com.apple.preference.notifications")!
                NSWorkspace.shared.open(url)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(32)
        .frame(width: 420, height: 260)
    }
}
