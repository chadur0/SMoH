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
    const result = document.getElementById("result");
    const search = document.getElementById("search");
    const itemList = document.getElementById("item-list");
    const clearSearch = document.getElementById("clear-search");

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
    
    lever.addEventListener("click", () => {
        const checkboxes = itemList.querySelectorAll("input[type='checkbox']");
        const selectedItems = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedItems.length === 0) {
            result.textContent = "Select at least one item!";
            return;
        }

        triggerSpinAnimation(selectedItems);
    });


reorderItems(); // sort and render on load

});

