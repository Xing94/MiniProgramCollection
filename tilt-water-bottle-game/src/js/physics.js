const physics = {
    bottle: {
        height: 200, // Height of the bottle in pixels
        width: 100, // Width of the bottle in pixels
        waterLevel: 0, // Current water level in pixels
        maxWaterLevel: 180 // Maximum water level in pixels
    },
    tiltSensitivity: 0.1, // Sensitivity of tilt effect

    updateWaterLevel: function(tilt) {
        // Calculate the change in water level based on the tilt
        const change = tilt * this.tiltSensitivity;

        // Update the water level, ensuring it stays within bounds
        this.bottle.waterLevel = Math.max(0, Math.min(this.bottle.maxWaterLevel, this.bottle.waterLevel - change));
    },

    resetWaterLevel: function() {
        this.bottle.waterLevel = this.bottle.maxWaterLevel; // Reset water level to full
    }
};

export default physics;