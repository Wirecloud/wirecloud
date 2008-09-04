(function() {
	var MAX_SLOTS = 5;
	
	MYMW.ui.TabView = function(nid, attr) {
		this._tabs = [];
		this._attr = attr || {};
		this._slots = [null, null, null, null, null]; // MAX_SLOTS
		
		// create initial empty content slots 
		var navHTML = "";
		var contentHTML = "";
		for (var i=0; i<MAX_SLOTS; i++) {
			navHTML += "<li id='mymw-nav-" + i + "' class='mymw-inactive'></li>"
			contentHTML += "<div id='mymw-slot-" + i + "' class='mymw-inactive'></div> ";
		}
		update('mymw-nav', navHTML);		
		update('mymw-content', contentHTML);

		for (var i in attr) {
			this.set(i, attr[i]);
		}		
	};
	var p = MYMW.ui.TabView.prototype;
	
	p.addTab = function(tab) {
	
		if (this._tabs.length === this.get('maxTabs')) {
			this.removeTab( this._LRU() );
		}

		this._tabs[this._tabs.length] = tab;
		
		// assign a free slot
		for (var i=0; i<this._slots.length; i++) {
			if (this._slots[i] === null) {
				this._slots[i] = tab;
				tab.assignSlot(i);
				break;
			}
		}
		
		// It this is the first tab, activate it
		if (this._tabs.length === 1) {
			this.set('activeIndex', 0); // set includes rendering
		}

		// this._renderHead();
		// this._renderBody();
	}

	p.removeTab = function(index) {
		var tab = this._tabs[index];
		this._slots[tab._slot] = null;
		
		tab.assignSlot();
		
		this._tabs.splice(index, 1);
		
		// If the active tab is removed, activate the first tab.
		if (this.get('activeIndex') === index && this._tabs.length > 0) {
			this.set('activeIndex', 0); // set includes rendering
		}
		
		// this._renderHead();
		// this._renderBody();
	}
	
	p.getTab = function(index) {
		return this._tabs[index];
	}

	// name in ['activeId', 'activeTab', 'activeIndex', 'maxTabs']
	p.set = function(name, value) {
		this._attr[name] = value;
		switch (name) {
			case 'activeId' :
				this.set('activeIndex', this.getTabIndexById(value));
				break;
			case 'activeTab' :
				for (var i=0; i<this._tabs.length; i++) {
					if (this._tabs[i] === value) {
						this.set('activeIndex', i);
						break;
					}
				}
				break;
			case 'activeIndex' :
				for (var i=0; i<this._tabs.length; i++)	{
					if (this._tabs[i].get('active') === true) {
						if (i !== value) {
							this._tabs[i].set('active', false);
						}
					} else {
						if (i === value) {
							this._tabs[i].set('active', true);
						}
					}
				}
				break;
			case 'maxTabs' :
				while (this._tabs.length > value) {
					this.removeTab( this._LRU() );
				}					
				break;
		}
	}
	
	p.get = function(name) {
		return this._attr[name];
	}
		
	// not in YUI
	p.clear = function(id) {
		var n = this._tabs.length;
		for (var i=0; i<n; i++) {
			this.removeTab(0);
		}
	}
	
	// not in YUI
	p.removeTabById = function(id) {
		var index = this.getTabIndexById(id);
		if (index >= 0) {
			this.removeTab( index );
		}
	}
	
	// not in YUI
	p.getTabIndexById = function(id) {
		var index;
		for (var i=0; i<this._tabs.length; i++) {
			if (this._tabs[i].get('id') === id) {
				index = i;
				break;
			}
		}
		return index;
	}
		
	p._renderHead = function() {
		var innerHTML = "";
		for (var i=0; i<this._tabs.length; i++) {
			this._tabs[i]._renderHead(); // delegate rendering
		}
	}
	
	p._renderBody = function() {
		for (var i=0; i<this._tabs.length; i++) {
			this._tabs[i]._renderBody(); // delegate rendering
		}				
	}
	
	p._LRU = function() {
		var result;
		var minTime = Number.MAX_VALUE;
		for (var i=0; i<this._tabs.length; i++) {
			if (this._tabs[i]._dateActivation < minTime) {
				minTime = this._tabs[i]._dateActivation;
				result = i;
			}
		}
		return result;
	}
	
	MYMW.ui.Tab = function(attr) {
		this._loaded = false;
		this._disposed = false;
		// this._head = "";
		// this._body = "";
		this._slot = undefined;
		this._dateActivation = undefined;
		
		this._attr = attr || {};
		
		for (var i in attr) {
			this.set(i, attr[i]);
		}
	};
	var p = MYMW.ui.Tab.prototype;
	
	p.assignSlot = function(slot) {
		if (slot != undefined) {
			this._slot = slot;
			this._renderBody();
			this._renderHead();			
		} else {	
			this._disposed = true;
			this._renderBody();
			this._renderHead();
			this._slot = slot;
		}
	}
	
	// name in ['active', 'label', 'content', 'dataSrc', 'cacheData', 'id', 'highlight']
	p.set = function(name, value) {
		this._attr[name] = value;
		switch (name) {
			case 'active' :				
				if (value === true) {
					this._dateActivation = new Date();
					this.__show();
				} else {
					this.__hide();
				}
				//this._renderBody();
				break;
			case 'highlight' :
				if (this._attr['active'] === true) {
					this._attr['highlight'] = false;
				}
			case 'label' :
				this._renderHead();
				break;
			case 'content' :	
				this._renderBody();
				break;
		}
	}
			
	p.get = function(name) {
		switch (name) {
			case 'content':
				var dataSrc = this.get('dataSrc');
				if (dataSrc &&
					this.get('active') &&
					(!this._loaded || !this.get('cacheData')))
				{
					var handle_ok = function( txt ) {
						this._loaded = true;
						this.set('content', txt);
					}
					var params = "_mymw_rnd=" + Math.random(); // random param to avoid caching
					ajax.apply(this, [dataSrc, handle_ok, null, params, true]);
				}
				break;
		}
		
		return this._attr[name];
	}

	p.__show = function() {
		if (this._slot != undefined) {
			if (!this._loaded) {
				this.get('content');
			}
			updateClass('mymw-slot-' + this._slot, '');
			updateClass('mymw-nav-' + this._slot, 'mymw-selected');
		}
	}
	
	p.__hide = function() {
		if (this._slot != undefined) {
			updateClass('mymw-slot-' + this._slot, 'mymw-inactive');
			updateClass('mymw-nav-' + this._slot, '');
		}
	}
	
	p._renderHead = function() {
		if (this._disposed === false) {
			if (this._slot != undefined) {
				this.__updateHead();
				update('mymw-nav-' + this._slot, this._head);
				updateClass('mymw-nav-' + this._slot, this.get('active') ? 'mymw-selected' : this.get('highlight') ? 'mymw-highlight' : '');
			}
			
			try {
				var onclick = this.get('onclick');
				var id = this.get('id')
				var fn = function() {				
					if (onclick) {
						onclick();
					}
					// TODO the name of the variable "tabview" is hardcoded !
					tabview.set("activeId", id);
				}
				id('mymw-link-' + this._slot).onclick = fn;
			} catch (e) {
				// browsers that do not allow dynamic binding for events will fail silently
			}			
		} else {			
			update('mymw-nav-' + this._slot, "");
			updateClass('mymw-nav-' + this._slot, 'mymw-inactive');
		}
	}
	
	p._renderBody = function() {
		if (this._disposed === false) {
			if (this._slot != undefined) {
				this.__updateBody();
				update('mymw-slot-' + this._slot, this._body); // asynch call, so we sinchronize UI
			}
		} else {
			update('mymw-slot-' + this._slot, "");
		}
	}
	
	p.__updateHead = function() {
		// TODO the name of the variable "tabview" is hardcoded !
		var onclick = 'javascript:tabview.set("activeId","' + this.get('id') + '");';
		var label = this.get('label');
		this._head = "<a href='#' onclick='" + onclick + "'>" + label + "</a>";
	}
	
	p.__updateBody = function() {
		this._body = this.get('content');
	}
})();