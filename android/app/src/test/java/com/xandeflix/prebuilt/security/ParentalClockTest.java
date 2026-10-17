package com.xandeflix.prebuilt.security;

import org.junit.Test;
import static org.junit.Assert.*;

public class ParentalClockTest {
    @Test public void bootIdentityIsIndependentOfWallClockAndChangesAcrossBoots() {
        assertEquals("boot:42", LocalParentalControlPlugin.clockId(42));
        assertEquals(LocalParentalControlPlugin.clockId(42), LocalParentalControlPlugin.clockId(42));
        assertNotEquals(LocalParentalControlPlugin.clockId(42), LocalParentalControlPlugin.clockId(43));
    }
    @Test public void missingBootCountUsesConservativeStableProcessIdentity() {
        String value = LocalParentalControlPlugin.clockId(-1);
        assertTrue(value.startsWith("process:"));
        assertEquals(value, LocalParentalControlPlugin.clockId(-1));
        assertNotEquals(value, LocalParentalControlPlugin.clockId(0));
    }
}
