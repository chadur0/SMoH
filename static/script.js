async function triggerSpinAnimation(selectedItems) {
    const display = document.getElementById("result");
    display.classList.add("blur");

    try {
        const response = await fetch("/spin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedItems })
        });

        const data = await response.json();

        if (data.error) {
            display.classList.remove("blur");
            display.textContent = data.error;
            return;
        }

        const prize = data.result;
        const spinPool = data.spinPool;

        // Simulate slot machine scroll
        let index = 0;
        let delay = 50;

        function animateSpin() {
            display.textContent = spinPool[index % spinPool.length];
            index++;

            if (delay < 300) {
                delay += 25; // gradually slow down
                setTimeout(animateSpin, delay);
            } else {
                display.classList.remove("blur");
                display.textContent = `${prize.name} (${prize.rarity})`;
                // Clear checkboxes
                document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
                // Reorder items
                reorderItems();
            }
        }

        animateSpin();

    } catch (err) {
        display.classList.remove("blur");
        display.textContent = "Spin failed. Check console.";
        console.error(err);
    }
}



document.addEventListener("DOMContentLoaded", () => {
    const lever = document.getElementById("lever");
    const leverGraphic = document.getElementById("lever-graphic");
    const result = document.getElementById("result");
    const search = document.getElementById("search");
    const itemList = document.getElementById("item-list");
    const clearSearch = document.getElementById("clear-search");
    const reel1 = document.getElementById("reel-1");
    const reel2 = document.getElementById("reel-2");
    const reel3 = document.getElementById("reel-3");

    let itemLabels = Array.from(itemList.querySelectorAll("label"));

    // Add clear search button functionality
    clearSearch.addEventListener("click", () => {
        search.value = "";
        search.dispatchEvent(new Event("input")); // trigger filtering
        search.focus();
    });
    
    // Clear search when a checkbox is clicked
    itemList.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("click", () => {
            search.value = "";
            search.dispatchEvent(new Event("input")); // trigger filtering
        });
    });    

    // Sort alphabetically on load
    itemLabels.sort((a, b) => {
        const aText = a.textContent.toLowerCase();
        const bText = b.textContent.toLowerCase();
        return aText.localeCompare(bText);
    });

    itemLabels.forEach(label => itemList.appendChild(label));

    // Reorder the list: selected items at top, rest alphabetically
    const reorderItems = () => {
        const labels = Array.from(itemList.querySelectorAll("label"));

        // Record initial positions
        const firstRects = new Map();
        labels.forEach(label => {
            firstRects.set(label, label.getBoundingClientRect());
        });

        // Separate selected/unselected
        const selected = [];
        const unselected = [];

        labels.forEach(label => {
            const cb = label.querySelector("input[type='checkbox']");
            if (cb.checked) {
                selected.push(label);
            } else {
                unselected.push(label);
            }
        });

        selected.sort((a, b) => a.textContent.localeCompare(b.textContent));
        unselected.sort((a, b) => a.textContent.localeCompare(b.textContent));

        // Clear and re-append
        const newOrder = [...selected, ...unselected];

        newOrder.forEach(label => itemList.appendChild(label));

        // Record final positions and animate
        newOrder.forEach(label => {
            const first = firstRects.get(label);
            const last = label.getBoundingClientRect();

            const deltaY = first.top - last.top;

            if (deltaY !== 0) {
                label.style.transform = `translateY(${deltaY}px)`;
                label.style.opacity = "0.5";

                requestAnimationFrame(() => {
                    label.style.transition = "transform 300ms ease, opacity 300ms ease";
                    label.style.transform = "translateY(0)";
                    label.style.opacity = "1";
                });

                // Reset styles after animation
                setTimeout(() => {
                    label.style.transition = "";
                    label.style.transform = "";
                }, 300);
            }
        });
    };


    itemList.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
            reorderItems();
        }
    });

    search.addEventListener("input", () => {
        const query = search.value.toLowerCase();
        itemLabels.forEach(label => {
            const match = label.textContent.toLowerCase().includes(query);
            label.style.display = match ? "block" : "none";
        });
    });

    document.getElementById("clear-selection").addEventListener("click", () => {
        document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
        reorderItems(); // update the order after clearing
    });
    
    function animateLever() {
        leverGraphic.classList.add("active");
        leverGraphic.style.transform = "translateY(20px) scaleY(0.9)";
        setTimeout(() => {
            leverGraphic.classList.remove("active");
            leverGraphic.style.transform = "";
        }, 350);
    }

    async function triggerSlotSpin(selectedItems) {
        animateLever();
        // Animate reels spinning
        const spinDuration = 1800;
        const spinInterval = 60;
        let spinPool = [];
        let spinTimer;
        let stop = false;

        // Fetch the spinPool and result from backend
        try {
            const response = await fetch("/spin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ selectedItems })
            });
            const data = await response.json();
            if (data.error) {
                result.textContent = data.error;
                return;
            }
            spinPool = data.spinPool;
            const prize = data.result;

            // Animate all reels
            let i = 0;
            function spinStep() {
                if (stop) return;
                reel1.textContent = spinPool[(i + 1) % spinPool.length];
                reel2.textContent = spinPool[(i + 2) % spinPool.length];
                reel3.textContent = spinPool[(i + 3) % spinPool.length];
                i++;
                spinTimer = setTimeout(spinStep, spinInterval);
            }
            spinStep();

            setTimeout(() => {
                stop = true;
                clearTimeout(spinTimer);
                // Show result in center reel, random in others
                reel1.textContent = spinPool[Math.floor(Math.random() * spinPool.length)];
                reel2.textContent = `${prize.name} (${prize.rarity})`;
                reel3.textContent = spinPool[Math.floor(Math.random() * spinPool.length)];
                // Also update the result area
                result.textContent = `${prize.name} (${prize.rarity})`;
                // Clear checkboxes
                document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
                reorderItems();
            }, spinDuration);
        } catch (err) {
            result.textContent = "Spin failed. Check console.";
            console.error(err);
        }
    }

    lever.addEventListener("click", () => {
        const checkboxes = itemList.querySelectorAll("input[type='checkbox']");
        const selectedItems = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedItems.length === 0) {
            result.textContent = "Select at least one item!";
            return;
        }
        triggerSlotSpin(selectedItems);
    });

    leverGraphic.addEventListener("click", () => {
        lever.click(); // Sync lever graphic with main lever button
    });


reorderItems(); // sort and render on load

});

