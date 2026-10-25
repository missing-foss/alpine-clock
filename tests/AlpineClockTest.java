// SPDX-License-Identifier: Apache-2.0
import java.util.HashMap;
import java.util.Map;
import me.jxl.kiosk.plugins.PluginHost;
import org.missing_foss.alpineclock.AlpineClockPlugin;

/** The plugin publishes its renderer at start, again only on a change, and nothing after stop. */
public final class AlpineClockTest {
    static final class Host implements PluginHost {
        int publications;
        String key, title, entry;
        Map<String, Object> options;
        public void publishScreensaverAsset(String key, String title, String entry, Map<String, Object> data) {
            this.key = key; this.title = title; this.entry = entry; options = new HashMap<>(data); publications++;
        }
        public void showWindow(String title, String message, String buttonLabel) { throw new AssertionError("no window"); }
        public void hideWindow() {}
        public void log(String message) {}
    }

    public static void main(String[] args) throws Exception {
        Host host = new Host();
        AlpineClockPlugin plugin = new AlpineClockPlugin();
        plugin.start(host, new HashMap<>());
        assert host.publications == 1 : "published at start";
        assert "alpine_clock".equals(host.key) && "Alpine Clock".equals(host.title) && "clock/index.html".equals(host.entry);

        plugin.configure(new HashMap<>());
        assert host.publications == 1 : "unchanged settings do not recreate the page";

        // The defaults: Night, mountains, no numbers, the face's hand colours.
        assert "Night".equals(host.options.get("face")) && Boolean.TRUE.equals(host.options.get("mountains"));
        assert "none".equals(host.options.get("numbers"));
        assert host.options.get("hourColor") == null && host.options.get("secondColor") == null;
        assert Double.valueOf(85).equals(host.options.get("size")) && Boolean.TRUE.equals(host.options.get("drift"));

        Map<String, Object> s = new HashMap<>();
        s.put("face", "Day");
        s.put("mountains", false);
        s.put("numbers", "12 \u00b7 3 \u00b7 6 \u00b7 9");
        s.put("hourColor", "#112233");
        plugin.configure(s);
        assert host.publications == 2 : "a changed setting publishes again";
        assert "Day".equals(host.options.get("face")) && Boolean.FALSE.equals(host.options.get("mountains"));
        assert "quarters".equals(host.options.get("numbers"));
        assert host.options.get("hourColor") == null : "chosen colours count only with the switch on";

        s.put("customHands", true);
        s.put("minuteColor", "not a colour");
        s.put("secondColor", "#AABBCC");
        s.put("numbers", "All hours");
        s.put("size", 500.0);
        plugin.configure(s);
        assert "#112233".equals(host.options.get("hourColor")) && "#AABBCC".equals(host.options.get("secondColor"));
        assert host.options.get("minuteColor") == null : "a bad colour is the face's own";
        assert "all".equals(host.options.get("numbers"));
        assert Double.valueOf(100).equals(host.options.get("size")) : "size is clamped";
        s.put("face", "Sepia");
        s.put("numbers", "Roman");
        plugin.configure(s);
        assert "Night".equals(host.options.get("face")) && "none".equals(host.options.get("numbers")) : "unknown values are the defaults";
        for (Object value : host.options.values()) {
            assert value == null || value instanceof String || value instanceof Boolean || value instanceof Number
                    : "the page takes scalar values only: " + value;
        }

        int before = host.publications;
        plugin.stop();
        plugin.configure(new HashMap<>());
        assert host.publications == before : "nothing is published after stop";
        System.out.println("AlpineClockTest: ok");
    }
}
