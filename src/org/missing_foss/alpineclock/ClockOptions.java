// SPDX-License-Identifier: Apache-2.0
package org.missing_foss.alpineclock;

import java.util.LinkedHashMap;
import java.util.Map;

/** The rendering options for assets/clock/index.html, from the plugin's settings. */
final class ClockOptions {
    private ClockOptions() {}

    private static String color(Object value) {
        return value instanceof String && ((String) value).matches("#[a-fA-F0-9]{6}") ? (String) value : null;
    }

    static Map<String, Object> from(Map<String, Object> settings) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("face", "Day".equals(settings.get("face")) ? "Day" : "Night");
        data.put("mountains", !Boolean.FALSE.equals(settings.get("mountains")));
        Object numbers = settings.get("numbers");
        data.put("numbers", "All hours".equals(numbers) ? "all" : "12 \u00b7 3 \u00b7 6 \u00b7 9".equals(numbers) ? "quarters" : "none");
        // The chosen hand colours, only with the switch on; a missing or bad
        // one is null, and the page then uses the face's own.
        boolean custom = Boolean.TRUE.equals(settings.get("customHands"));
        data.put("hourColor", custom ? color(settings.get("hourColor")) : null);
        data.put("minuteColor", custom ? color(settings.get("minuteColor")) : null);
        data.put("secondColor", custom ? color(settings.get("secondColor")) : null);
        Object size = settings.get("size");
        double percent = size instanceof Number ? ((Number) size).doubleValue() : 85;
        data.put("size", Double.isFinite(percent) ? Math.max(40, Math.min(100, percent)) : 85);
        data.put("drift", !Boolean.FALSE.equals(settings.get("drift")));
        return data;
    }
}
