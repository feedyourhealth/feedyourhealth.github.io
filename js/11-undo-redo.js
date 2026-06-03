// ✅ PHASE 4: UNDO/REDO SYSTEM
// File: js/11-undo-redo.js
// Description: Command pattern implementation for undo/redo functionality

/**
 * UndoRedoManager - Manages undo/redo history with command pattern
 */
class UndoRedoManager {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
    console.log('✅ UndoRedoManager initialized');
  }

  execute(command) {
    if (!command || typeof command.execute !== 'function') {
      console.warn('⚠️ Invalid command:', command);
      return;
    }

    // Remove any undone commands from history
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Execute and store command
    command.execute();
    this.history.push(command);
    this.currentIndex++;

    console.log('📝 Command executed:', command.constructor.name, '| History:', this.currentIndex + 1);
  }

  undo() {
    if (!this.canUndo()) {
      console.warn('⚠️ Cannot undo - no history');
      return;
    }

    const command = this.history[this.currentIndex];
    if (command && typeof command.undo === 'function') {
      command.undo();
      this.currentIndex--;
      console.log('↶ Undo:', command.constructor.name);
    }
  }

  redo() {
    if (!this.canRedo()) {
      console.warn('⚠️ Cannot redo - no forward history');
      return;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    if (command && typeof command.execute === 'function') {
      command.execute();
      console.log('↷ Redo:', command.constructor.name);
    }
  }

  canUndo() {
    return this.currentIndex >= 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
}

/**
 * CreateClientCommand - Undo/redo for creating a new client
 */
class CreateClientCommand {
  constructor(client) {
    this.client = client;
  }

  execute() {
    clients.push(this.client);
    selectClient(this.client.id);
    renderSB();
    renderMain();
    console.log('✓ Client created:', this.client.name);
  }

  undo() {
    clients = clients.filter(c => c.id !== this.client.id);
    if (curId === this.client.id) {
      curId = null;
      document.getElementById('main').innerHTML = '<div class="empty"><div style="font-size:15px;font-weight:600">Κανένας πελάτης επιλεγμένος</div></div>';
    }
    renderSB();
    console.log('✗ Client deleted (undo):', this.client.name);
  }
}

/**
 * DeleteClientCommand - Undo/redo for deleting a client
 */
class DeleteClientCommand {
  constructor(client) {
    this.client = client;
    this.index = clients.findIndex(c => c.id === client.id);
  }

  execute() {
    clients = clients.filter(c => c.id !== this.client.id);
    if (curId === this.client.id) {
      curId = null;
      document.getElementById('main').innerHTML = '<div class="empty"><div style="font-size:15px;font-weight:600">Κανένας πελάτης επιλεγμένος</div></div>';
    }
    renderSB();
    console.log('✗ Client deleted:', this.client.name);
  }

  undo() {
    if (this.index >= 0) {
      clients.splice(this.index, 0, this.client);
    } else {
      clients.push(this.client);
    }
    selectClient(this.client.id);
    renderSB();
    renderMain();
    console.log('✓ Client restored (undo):', this.client.name);
  }
}

/**
 * UpdateClientCommand - Undo/redo for updating a client property
 */
class UpdateClientCommand {
  constructor(client, key, oldValue, newValue) {
    this.client = client;
    this.key = key;
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  execute() {
    this.client[this.key] = this.newValue;
    save();
    renderMain();
    console.log('◆ Updated', this.key, ':', this.oldValue, '→', this.newValue);
  }

  undo() {
    this.client[this.key] = this.oldValue;
    save();
    renderMain();
    console.log('◆ Reverted', this.key, ':', this.newValue, '→', this.oldValue);
  }
}

/**
 * GeneratePlanCommand - Undo/redo for generating meal plan
 */
class GeneratePlanCommand {
  constructor(client, oldPlan) {
    this.client = client;
    this.oldPlan = JSON.parse(JSON.stringify(oldPlan));
  }

  execute() {
    genPlan();
    console.log('📋 Plan generated');
  }

  undo() {
    this.client.weekPlan = JSON.parse(JSON.stringify(this.oldPlan));
    save();
    renderWeekTable();
    console.log('📋 Plan reverted to previous version');
  }
}

console.log('✅ js/11-undo-redo.js loaded');
