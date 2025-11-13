// 1. Získání kontejnerů pro vykreslení a ovládání
var container = document.getElementById('mynetwork');

// Pomocná třída pro uzly (zachováno pro přehlednost)
function Node(id, label, color, state, length = 1000) {
    this.id = id;
    this.label = label;
    this.color = color;
    this.state = state;
    this.length = length;
}

function Edge(from, to, length) {
    this.from = from;
    this.to = to;
    this.length = length;
    this.label = length.toString();
    this.arrows = 'to';
}

var nodes = new vis.DataSet([
    // Startovní uzel: ID 1, délka 0
    new Node(1, ' A ', 'red', 1, 0), 
    
    // Ostatní uzly: ID 2-12, barva změněna na 'grey', délka 1000
    new Node(2, ' B ', 'grey', 0, 1000), 
    new Node(3, ' C ', 'grey', 0, 1000), 
    new Node(4, ' D ', 'grey', 0, 1000), 
    new Node(5, ' E ', 'grey', 0, 1000),
    new Node(6, ' F ', 'grey', 0, 1000),
    new Node(7, ' G ', 'grey', 0, 1000),
    new Node(8, ' H ', 'grey', 0, 1000),
    new Node(9, ' I ', 'grey', 0, 1000),
    new Node(10, ' J ', 'grey', 0, 1000),
    new Node(11, ' K ', 'grey', 0, 1000),
    new Node(12, ' L ', 'grey', 0, 1000)
]);

// 3. Definice Hran (Edges) - Použijte vis.


var edges = new vis.DataSet([
    // Cesty ze Startu (ID 1)
    new Edge(1, 2, 8),  // A -> B (8)
    new Edge(1, 3, 3),  // A -> C (3) - Nejrychlejší start
    new Edge(1, 5, 20), // A -> E (20) - Přímá, ale drahá cesta

    // Střední sekce
    new Edge(2, 4, 1),  // B -> D (1) - Cesta do D přes B: 8 + 1 = 9
    new Edge(3, 4, 7),  // C -> D (7) - Cesta do D přes C: 3 + 7 = 10 (Delší, ale relaksační krok musí zaručit 9)
    new Edge(3, 6, 15), // C -> F (15)

    // Komplexní relaksační test na uzlu E (ID 5)
    new Edge(4, 5, 2),  // D -> E (2) - Cesta do E: 3 + 7 + 2 = 12 (lepší než 20)
    new Edge(4, 7, 5),  // D -> G (5)

    // Rozcestí (ID 6, 7, 8)
    new Edge(5, 7, 4),  // E -> G (4)
    new Edge(6, 8, 2),  // F -> H (2)
    new Edge(7, 8, 1),  // G -> H (1) - Testuje relaksační krok pro H
    new Edge(7, 9, 3),  // G -> I (3)

    // Zpětná hrana a dlouhá cesta
    new Edge(9, 6, 1),  // I -> F (1) - Zpětná hrana pro F

    // Předposlední uzly
    new Edge(8, 10, 6), // H -> J (6)
    new Edge(9, 11, 4), // I -> K (4)
    new Edge(10, 11, 2),// J -> K (2) - Další relaksační test pro K

    // Cíl (ID 12)
    new Edge(10, 12, 1),// J -> L (1) - Krátká cesta do cíle
    new Edge(11, 12, 5) // K -> L (5)
]);

// 4. Seskupení dat
var data = {
    nodes: nodes,
    edges: edges
};

// 5. Možnosti konfigurace (Options)
var options = {
    layout: {
        improvedLayout: true
    },
    edges: {
        font: {
            align: 'middle'
        },
        smooth: {
            enabled: false
        },
        length: 100000
    },
    physics: {
        enabled: false, // Povolila jsem fyziku, aby se graf lépe zobrazil na začátku
        stabilization: {
            iterations: 1000 
        }
    },
    interaction: {
        dragNodes: true,
        zoomView: true
    }
};

// 6. Vykreslení Grafu
var network = new vis.Network(container, data, options);


// --- LOGIKA TLAČÍTEK ---

// Tlačítko pro přidání nového uzlu
document.getElementById('newNode').onclick = function () {
    var numberInput = document.getElementById('id');
    var number = numberInput.value.trim();

    if (!number || nodes.get(number)) {
        alert("Prosím zadejte unikátní ID pro uzel.");
        return;
    }
    
    // Získání náhodné pozice pro uzel
    var width = container.clientWidth;
    var height = container.clientHeight;
    var randomX = Math.floor(Math.random() * width) - (width / 2);
    var randomY = Math.floor(Math.random() * height) - (height / 2);
    
    // Přidání uzlu do datové sady
    nodes.update({
        id: number, 
        label: '   ' + number + '   ', 
        x: randomX, 
        y: randomY, 
        color: 'yellow',
        state: 0
    }); 
    numberInput.value = ''; // Vyčištění pole
};

// Tlačítko pro smazání vybraného uzlu/hrany
document.getElementById('delete').onclick = function () {
    network.deleteSelected();
};


// Tlačítko pro "next" - Logika pro BFS/Dijkstra
// TinyQueue a logika je zabalena do okamžitě volané funkce (IIFE)
// pro udržení stavu (queue, previous)
document.getElementById('next').onclick = (function () {
    let queue = new TinyQueue([], function (first, second) {
        return (first.length - second.length);
    });
    
    let previous = null;
    
    return function () {
        // První spuštění: Inicializace fronty (startovní uzel ID 1)
        if (!queue.length && !previous) {
             let startNode = nodes.get(1);
             if (startNode) {
                 queue.push(startNode);
             }
        }
        
        if (queue.length) {
            if (previous) {
                // Předchozí uzel dokončen: Změna na zelenou (navštíveno)
                nodes.update({id: previous.id, color: 'green'});
            }
            
            // Vyjmutí dalšího uzlu z fronty
            let current = queue.pop();
            while (current.length != nodes.get(current.id).length) current = queue.pop();
            document.getElementById('queue').value += current.length + "-";
            
            // Aktuální uzel: Změna na černou (zpracovává se)
            nodes.update({id: current.id, color: 'black', state: 2});
            
            // Získání ID sousedů z hrany
            let connectedEdges = edges.get({
                filter: function (item) {
                    return item.from == current.id;
                }
            });

            // Přidání dosud nenavštívených sousedů do fronty
            connectedEdges.forEach(edge => {
                let nextId = edge.to;
                let nextNode = nodes.get(nextId);
                
                if (nextNode.state != 2) {
                    if (current.length + edge.length < nextNode.length) {
                        nodes.update({id: nextId, length: current.length + edge.length, state: 1});
                        nextNode = nodes.get(nextId);
                        queue.push(nextNode); 
                }
            }
            });

            previous = current; // Uložení aktuálního uzlu pro další cyklus
            
        } else {
             // Konec algoritmu
             alert("Prohledávání je u konce!");
             if (previous) {
                 nodes.update({id: previous.id, color: 'green'});
                 previous = null; // Reset stavu
             }
        }
    };
})();