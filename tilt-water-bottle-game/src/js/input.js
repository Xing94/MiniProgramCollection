const input = (() => {
    let tiltX = 0;
    let tiltY = 0;

    const init = () => {
        window.addEventListener('deviceorientation', handleOrientation, false);
    };

    const handleOrientation = (event) => {
        tiltX = event.beta; // Front-to-back tilt in degrees
        tiltY = event.gamma; // Left-to-right tilt in degrees
        updateWaterSpillage();
    };

    const updateWaterSpillage = () => {
        // Here you would implement the logic to determine how much water spills
        // based on the tilt values (tiltX and tiltY).
        // This function can communicate with the physics module to update the game state.
    };

    const getTiltValues = () => {
        return { tiltX, tiltY };
    };

    return {
        init,
        getTiltValues
    };
})();

export default input;