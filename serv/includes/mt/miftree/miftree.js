/*
Mif.Tree
*/
if(!Mif) var Mif={};

Mif.Tree = new Class({

	Implements: [new Events, new Options],
		
	options:{
		types: {},
		forest: false,
		animateScroll: true,
		height: 18
	},
	
	initialize: function(options) {
		this.setOptions(options);
		$extend(this, {
			types: this.options.types,
			forest: this.options.forest,
			animateScroll: this.options.animateScroll,
			dfltType: this.options.dfltType,
			height: this.options.height,
			container: $(options.container),
			UID: 0,
			$: {},
			key: {}
		});
		this.defaults={
			name: '',
			cls: '',
			openIcon: 'mif-tree-empty-icon',
			closeIcon: 'mif-tree-empty-icon',
			loadable: false
		};
		this.dfltState={
			open: false
		}
		Mif.Tree.UID++;
		this.DOMidPrefix='mif-tree-'+Mif.Tree.UID+'-';
		this.wrapper=new Element('div').addClass('mif-tree-wrapper').injectInside(this.container);
		this.initEvents();
		this.initScroll();
		this.initSelection();
		this.initHover();
	},
	
	initEvents: function(){
		this.wrapper.addEvents({
			mousemove: this.mouse.bindWithEvent(this),
			mouseover: this.mouse.bindWithEvent(this),
			mouseout: this.mouse.bindWithEvent(this),
			mouseleave: this.mouseLeave.bind(this),
			mousedown: $lambda(false),
			click: this.toggleClick.bindWithEvent(this),
			dblclick: this.toggleDblclick.bindWithEvent(this),
			keydown: this.keyDown.bindWithEvent(this),
			keyup: this.keyUp.bindWithEvent(this)
		});
	},
	
	$getIndex: function(){//return array of visible nodes.
		this.$index=[];
		var node=this.forest ? this.root.getFirst() : this.root;
		do{
			this.$index.push(node);
		}while(node=node.getNextVisible());
	},
	
	mouseLeave: function(){
		this.mouse.coords={x:null,y:null};
		this.mouse.target=false;
		this.mouse.node=false;
		if(this.hover) this.hover();
	},
	
	mouse: function(event){
		this.mouse.coords=this.getCoords(event);
		var target=this.getTarget(event);
		this.mouse.target=target.target;
		this.mouse.node	= target.node;
	},
	
	getTarget: function(event){
		var target=event.target;
		while(!/mif-tree/.test(target.className)){
			target=target.parentNode;
		}
		var test=target.className.match(/mif-tree-(gadjet)-[^n]|mif-tree-(icon)|mif-tree-(name)|mif-tree-(checkbox)/);
		if(!test){
			var y=this.mouse.coords.y;
			if(y==-1||!this.$index) {
				node=false;
			}else{
				node=this.$index[((y)/this.height).toInt()];
			}
			return {
				node: node,
				target: 'node'
			}
		}
		for(var i=5;i>0;i--){
			if(test[i]){
				var type=test[i];
				break;
			}
		}
		return {
			node: this.$[target.getAttribute('uid')],
			target: type
		}
	},
	
	getCoords: function(event){
		var position=this.wrapper.getPosition();
		var x=event.page.x-position.x;
		var y=event.page.y-position.y;
		var wrapper=this.wrapper;
		if((y-wrapper.scrollTop>wrapper.clientHeight)||(x-wrapper.scrollLeft>wrapper.clientWidth)){//scroll line
			y=-1;
		}
		return{
			x: x,
			y: y
		};
	},
	
	keyDown: function(event){
		this.key=event;
		this.key.state='down';
	},
	
	keyUp: function(event){
		this.key={};
		this.key.state='up';
	},
	
	toggleDblclick: function(event){
		var target=this.mouse.target;
		if(!(target=='name'||target=='icon')) return;
		this.mouse.node.toggle();
	},
	
	toggleClick: function(event){
		if(this.mouse.target!='gadjet') return;
		this.mouse.node.toggle();
	},
	
	initScroll: function(){
		this.scroll=new Fx.Scroll(this.wrapper);
	},
	
	scrollTo: function(node){
		var position=node.getVisiblePosition();
		var top=position*this.height;
		var up=top<this.wrapper.scrollTop;
		var down=top>(this.wrapper.scrollTop+this.wrapper.offsetHeight);
		if(position==-1 || ( !up && !down ) ) {
			this.scroll.fireEvent('complete');
			return false;
		}
		if(this.animateScroll){
			this.scroll.start(this.wrapper.scrollLeft, top-(down ? this.wrapper.offsetHeight-this.height : 0));
		}else{
			this.scroll.set(this.wrapper.scrollLeft, top-(down ? this.wrapper.offsetHeight-this.height : 0));
			this.scroll.fireEvent('complete');
		}
	}
	
});
Mif.Tree.UID=0;


/*
Mif.Tree.Node
*/
Mif.Tree.Node = new Class({

	Implements: [new Events],
	
	initialize: function(structure, options) {
		$extend(this, structure);
		this.children=[];
		this.type=options.type||this.tree.dfltType;
		this.property=options.property;
		this.data=options.data;
		this.state=$unlink($extend(this.tree.dfltState, options.state));
		this.$calculate();
		
		this.UID=this.tree.UID++;
		this.tree.$[this.UID]=this;
	},
	
	$calculate: function(){
		$extend(this, this.tree.defaults);
		this.type=$splat(this.type);
		this.type.each(function(type){
			var props=this.tree.types[type];
			if(props) $extend(this, props);
		}, this);
		$extend(this, this.property);
	},
	
	getDOM: function(what){
		var node=$(this.tree.DOMidPrefix+this.UID);
		if(what=='node') return node;
		var wrapper=node.getFirst();
		if(what=='wrapper') return wrapper;
		if(what=='children') return wrapper.getNext();
		return wrapper.getElement('.mif-tree-'+what);
	},
	
	getGadjetType: function(){
		return (this.loadable && !this.isLoaded()) ? 'plus' : (this.hasChildren() ? (this.isOpen() ? 'minus' : 'plus') : 'none');
	},
	
	toggle: function(state) {
		if(this.state.open==state || this.$loading || this.$toggling) return;
		if(this.loadable && !this.state.loaded) {
			this.addEvent('load',function(){
				this.toggle();
			}.bind(this));
			this.load();
			return;
		}
		if(!this.hasChildren()) return;
		var next=this.getNextVisible();
		this.state.open = !this.state.open;
		var state=this.state.open;
		if(!this.$draw) Mif.Tree.Draw.children(this);
		var children=this.getDOM('children');	
		var gadjet=this.getDOM('gadjet');
		var icon=this.getDOM('icon');
		children.style.display=this.isOpen() ? 'block' : 'none';
		gadjet.className='mif-tree-gadjet mif-tree-gadjet-'+this.getGadjetType();
		icon.className='mif-tree-icon '+this[this.isOpen() ? 'openIcon' : 'closeIcon'];
		this.tree.hoverState.gadjet=false;
		this.tree.hover();
		this.tree.$getIndex();
		this.tree.fireEvent('toggle', [this, this.state.open]);
	},
	
	recursive: function(fn, args){
		args=$splat(args);
		if(fn.apply(this, args)!==false){
			this.children.each(function(node){
				node.recursive(fn, args);
			});
		}
		return this;
	},
	
	isOpen: function(){
		return this.state.open;
	},
	
	isLoaded: function(){
		return this.state.loaded;
	},
	
	isLast: function(){
		if(this.parentNode==null || this.parentNode.children.getLast()==this) return true;
		return false;
	},
	
	isFirst: function(){
		if(this.parentNode==null || this.parentNode.children[0]==this) return true;
		return false;
	},
	
	isRoot: function(){
		return this.parentNode==null ? true : false;
	},
	
	getChildren: function(){
		return this.children;
	},
	
	hasChildren: function(){
		return this.children.length ? true : false;
	},
	
	index: function(){
		if( this.isRoot() ) return 0;
		return this.parentNode.children.indexOf(this);
	},
	
	getNext: function(){
		if(this.isLast()) return null;
		return this.parentNode.children[this.index()+1];
	},
	
	getPrevious: function(){
		if( this.isFirst() ) return null;
		return this.parentNode.children[this.index()-1];
	},
	
	getFirst: function(){
		if(!this.hasChildren()) return null;
		return this.children[0];
	},
	
	getLast: function(){
		if(!this.hasChildren()) return null;
		return this.children.getLast();		
	},
	
	getParent: function(){
		return this.parentNode;
	},
	
	getNextVisible: function(){
		var current=this;
		if(current.isRoot()){
			if(!current.isOpen() || !current.hasChildren()) return false;
			return current.getFirst();
		}else{
			if(current.isOpen() && current.getFirst()){
				return current.getFirst();
			}else{
				var parent=current;
				do{
					current=parent.getNext();
					if(current) return current;
				}while( parent=parent.parentNode )
				return false;
			}
		}
	},
	
	getPreviousVisible: function(){
		var current=this;
		if( current.isFirst() && ( !current.parentNode || (current.tree.forest && current.parentNode.isRoot()) ) ){
			return false;
		}else{
			if( current.getPrevious() ){
				current=current.getPrevious();
				while( current.isOpen() && current.getLast() ){
					current=current.getLast();
				}
				return current;
			}else{
				return current.parentNode;
			}
		}
	},
	
	getVisiblePosition: function(){
		return this.tree.$index.indexOf(this);
	},
		
	contains: function(node){
		do{
			if(node==this) return true;
			node=node.parentNode;
		}while(node);
		return false;
	},

	addType: function(type){
		this.type.include(type);
		this.$calculate();
		Mif.Tree.Draw.update(this);
		return this;
	},

	removeType: function(type){
		this.type.erase(type);
		this.$calculate();
		Mif.Tree.Draw.update(this);
		return this;
	},
	
	set: function(props){
		this.tree.fireEvent('beforeSet', [this]);
		$extend(this, props);
		if(props.property||props.type||props.state){
			this.$calculate();
			Mif.Tree.Draw.update(this);
		}
		this.tree.fireEvent('set', [this, props]);
	}
	
});


/*
Mif.Tree.Draw
*/
Mif.Tree.Draw={

	getHTML: function(node,html){
		var prefix=node.tree.DOMidPrefix;
		if($defined(node.state.checked)){
			var checkbox='<span class="mif-tree-checkbox mif-tree-node-'+node.state.checked+'" uid="'+node.UID+'">'+Mif.Tree.Draw.zeroSpace+'</span>';
		}else{
			var checkbox='';
		}
		html=html||[];
		html.push(
		'<div class="mif-tree-node ',(node.isLast() ? 'mif-tree-node-last' : ''),'" id="',prefix,node.UID,'">',
			'<span class="mif-tree-node-wrapper ',node.cls,'" uid="',node.UID,'">',
				'<span class="mif-tree-gadjet mif-tree-gadjet-',node.getGadjetType(),'" uid="',node.UID,'">',Mif.Tree.Draw.zeroSpace,'</span>',
				checkbox,
				'<span class="mif-tree-icon ',node.closeIcon,'" uid="',node.UID,'">',Mif.Tree.Draw.zeroSpace,'</span>',
				'<span class="mif-tree-name" uid="',node.UID,'">',node.name,'</span>',
			'</span>',
			'<div class="mif-tree-children" style="display:none"></div>',
		'</div>'
		);
		return html;
	},
	
	children: function(parent, container){
		parent.open=true;
		parent.$draw=true;
		var html=[];
		var children=parent.children;
		for(var i=0,l=children.length;i<l;i++){
			this.getHTML(children[i],html);
		}
		container=container || parent.getDOM('children');
		container.set('html', html.join(''));
		parent.tree.fireEvent('drawChildren',[parent]);
	},
	
	root: function(tree){
		var domRoot=this.node(tree.root);
		domRoot.injectInside(tree.wrapper);
		tree.fireEvent('drawRoot');
	},
	
	forestRoot: function(tree){
		var container=new Element('div').addClass('mif-tree-children-root').injectInside(tree.wrapper);
		Mif.Tree.Draw.children(tree.root, container);
	},
	
	node: function(node){
		return new Element('div').set('html', this.getHTML(node).join('')).getFirst();
	},
	
	update: function(node){
		if(!node) return;
		if(node.tree.forest && node.isRoot()) return;
		if(!node.hasChildren()) node.state.open=false;
		node.getDOM('name').set('html', node.name);
		node.getDOM('gadjet').className='mif-tree-gadjet mif-tree-gadjet-'+node.getGadjetType();
		node.getDOM('icon').className='mif-tree-icon '+node[node.isOpen() ? 'openIcon' : 'closeIcon'];
		node.getDOM('node')[(node.isLast() ?'add' : 'remove')+'Class']('mif-tree-node-last');
		if(node.$loading) return;
		var children=node.getDOM('children');
		children.className='mif-tree-children';
		if(node.isOpen()){
			if(!node.$draw) Mif.Tree.Draw.children(node);
			children.style.display='block';
		}else{
			children.style.display='none';
		}
		node.tree.fireEvent('updateNode', node);
		return node;
	},
	
	updateDOM: function(node, domNode){
		domNode= domNode||node.getDOM('node');
		var previous=node.getPrevious();
		if(previous){
			domNode.injectAfter(previous.getDOM('node'));
		}else{
			domNode.injectTop(node.parentNode.getDOM('children'));
		}
	}
	
};
Mif.Tree.Draw.zeroSpace=Browser.Engine.trident ? '&shy;' : (Browser.Engine.webkit ? '&#8203' : '');


/*
Mif.Tree.Selection
*/
Mif.Tree.implement({
	
	initSelection: function(){
		this.defaults.selectClass='';
		this.wrapper.addEvent('mousedown', this.attachSelect.bindWithEvent(this));
	},
	
	attachSelect: function(event){
		if(!['icon', 'name', 'node'].contains(this.mouse.target)) return;
		var node=this.mouse.node;
		if(!node) return;
		this.select(node);
	},
	
	select: function(node) {
		if(Browser.Engine.gecko) {
			this.wrapper.focus();
		}
		var current=this.selected;
		if (current==node) return;
		if (current) {
			current.select(false);
		}
		this.selected = node;
		node.select(true);
	},
	
	unselect: function(){
		var current=this.selected;
		if(!current) return;
		this.selected=false;
		current.select(false);
	},
	
	getSelected: function(){
		return this.selected;
	},
	
	isSelected: function(node){
		return node.isSelected();
	}
	
});

Mif.Tree.Node.implement({
		
	select: function(state) {
		this.state.selected = state;
		var wrapper=this.getDOM('wrapper');
		wrapper[(state ? 'add' : 'remove')+'Class'](this.selectClass||'mif-tree-node-selected');
		this.tree.fireEvent(state ? 'select' : 'unSelect', [this]);
		this.tree.fireEvent('selectChange', [this, state]);
	},
	
	isSelected: function(){
		return this.state.selected;
	}
	
});


/*
Mif.Tree.Hover
*/
Mif.Tree.implement({
	
	initHover: function(){
		this.defaults.hoverClass='';
		this.wrapper.addEvent('mousemove', this.hover.bind(this));
		this.wrapper.addEvent('mouseout', this.hover.bind(this));
		this.defaultHoverState={
			gadjet: false,
			checkbox: false,
			icon: false,
			name: false,
			node: false
		}
		this.hoverState=$unlink(this.defaultHoverState);
	},
	
	hover: function(){
		var cnode=this.mouse.node;
		var ctarget=this.mouse.target;
		$each(this.hoverState, function(node, target, state){
			if(node==cnode && (target=='node'||target==ctarget)) return;
			if(node) {
				Mif.Tree.Hover.out(node, target);
				this.fireEvent('hover', [node, target, 'out']);
				state[target]=false;
			}
			if(cnode && (target=='node'||target==ctarget)) {
				Mif.Tree.Hover.over(cnode, target);
				this.fireEvent('hover', [cnode, target, 'over']);
				state[target]=cnode;
			}else{
				state[target]=false;
			}
		}, this);
	},
	
	updateHover: function(){
		this.hoverState=$unlink(this.defaultHoverState);
		this.hover();
	}
	
});

Mif.Tree.Hover={
	
	over: function(node, target){
		var wrapper=node.getDOM('wrapper');
		wrapper.addClass((node.hoverClass||'mif-tree-hover')+'-'+target);
		if(node.state.selected) wrapper.addClass((node.hoverClass||'mif-tree-hover')+'-selected-'+target);
	},
	
	out: function(node, target){
		var wrapper=node.getDOM('wrapper');
		wrapper.removeClass((node.hoverClass||'mif-tree-hover')+'-'+target).removeClass((node.hoverClass||'mif-tree-hover')+'-selected-'+target);
	}
	
}


/*
Mif.Tree.Load
*/
Mif.Tree.Load={
		
	children: function(children, parent, tree){
		for( var i=children.length; i--; ){
			var child=children[i];
			var subChildren=child.children;
			delete child.children;
			var node=new Mif.Tree.Node({
				tree: tree,
				parentNode: parent||undefined
			}, child);
			if( tree.forest || parent != undefined){
				parent.children.unshift(node);
			}else{
				tree.root=node;
			}
			if(subChildren && subChildren.length){
				arguments.callee(subChildren, node, tree);
			}
		}
		if(parent) parent.state.loaded=true;
		tree.fireEvent('loadChildren', parent);
	}
	
};

Mif.Tree.implement({

	load: function(options){
		var tree=this;
		this.loadOptions=this.loadOptions||$lambda({});
		function success(json){
			if(tree.forest){
				tree.root=new Mif.Tree.Node({
					tree: tree,
					parentNode: null
				}, {});
				var parent=tree.root;
			}else{
				var parent=null;
			}
			Mif.Tree.Load.children(json, parent, tree);
			Mif.Tree.Draw[tree.forest ? 'forestRoot' : 'root'](tree);
			tree.$getIndex();
			tree.fireEvent('load');
			return tree;
		}
		options=$extend($extend({
			isSuccess: $lambda(true),
			secure: true,
			onSuccess: success,
			method: 'get'
		}, this.loadOptions()), options);
		if(options.json) return success(options.json);
		new Request.JSON(options).send();
		return this;
	}
	
});

Mif.Tree.Node.implement({
	
	load: function(options){
		this.$loading=true;
		options=options||{};
		this.addType('loader');
		var self=this;
		function success(json){
			Mif.Tree.Load.children(json, self, self.tree);
			delete self.$loading;
			self.state.loaded=true;
			self.removeType('loader');
			self.fireEvent('load');
			return self;
		}
		options=$extend($extend($extend({
			isSuccess: $lambda(true),
			secure: true,
			onSuccess: success,
			method: 'get'
		}, this.tree.loadOptions(this)), this.loadOptions), options);
		if(options.json) return success(options.json);
		new Request.JSON(options).send();
		return this;
	}
	
});


/*
Mif.Tree.KeyNav
*/
Mif.Tree.KeyNav=new Class({
	
	initialize: function(tree, options){
		this.tree=tree;
		tree.wrapper.addEvent('keydown',function(event){
			if(!['down','left','right','up'].contains(event.key)) return;
			if(!tree.selected){
				tree.select(tree.forest ? tree.root.getFirst() : tree.root);
			}else{
				var current=tree.selected;
				switch (event.key){
					case 'down': this.goForward(current);event.stop();break;  
					case 'up': this.goBack(current);event.stop();break;   
					case 'left': this.goLeft(current);event.stop();break;
					case 'right': this.goRight(current);event.stop();break;
				}
			}
			var height=tree.height;
			function autoScroll(){
				var wrapper=tree.wrapper;
				var i=tree.selected.getVisiblePosition();
				var top=i*height-wrapper.scrollTop;
				var bottom=top+height;
				if(top<height){
					wrapper.scrollTop-=height;
				}
				if(wrapper.offsetHeight-bottom<height){
					wrapper.scrollTop+=height;
				}
			}
			autoScroll();
		}.bind(this));
	},

	goForward: function(current){
		var forward=current.getNextVisible();
		if( forward ) this.tree.select(forward)
	},
	
	goBack: function(current){
		var back=current.getPreviousVisible();
		if (back) this.tree.select(back);
	},
	
	goLeft: function(current){
		if(current.isRoot()){
			if(current.isOpen()){
				current.toggle();
			}else{
				return false;
			}
		}else{
			if( current.hasChildren() && current.isOpen() ){
				current.toggle();
			}else{
				if(current.tree.forest && current.getParent().isRoot()) return false;
				return this.tree.select(current.getParent());
			}
		}
	},
	
	goRight: function(current){
		if(!current.hasChildren()&&!current.loadable){
			return false;
		}else if(!current.isOpen()){
			return current.toggle();
		}else{
			return this.tree.select(current.getFirst());
		}
	}
});


/*
Mif.Tree.Sort
*/
Mif.Tree.implement({
	
	initSortable: function(sortFunction){
		this.sortable=true;
		this.sortFunction=sortFunction||function(node1, node2){
			if(node1.name>node2.name){
				return 1;
			}else if(node1.name<node2.name){
				return -1;
			}else{
				return 0;
			}
		}
		this.addEvent('loadChildren', function(parent){
			if(parent) parent.sort();
		});
		this.addEvent('structureChange', function(from, to, where, type){
			from.sort();
		});
		return this;
	}
	
});


Mif.Tree.Node.implement({

	sort: function(sortFunction){
		this.children.sort(sortFunction||this.tree.sortFunction);
		return this;
	}
	
});


/*
Mif.Tree.Transform
*/
Mif.Tree.Node.implement({
	
	inject: function(node, where, domNode){//domNode - internal property
		var parent=this.parentNode;
		var previous=this.getPrevious();
		var type=domNode ? 'copy' : 'move';
		switch(where){
			case 'after':
			case 'before':
				if( node['get'+(where=='after' ? 'Next' : 'Previous')]()==this ) return false;
				if(this.parentNode) this.parentNode.children.erase(this);
				this.parentNode=node.parentNode;
				this.parentNode.children.inject(this, node, where);
				break;
			case 'inside':
				if( node.getLast()==this ) return false;
				if(this.parentNode) this.parentNode.children.erase(this);
				node.children.push(this);
				this.parentNode=node;
				node.$draw=true;
				node.state.open=true;
				break;
		}		
		this.tree.fireEvent('structureChange', [this, node, where, type]);
		Mif.Tree.Draw.updateDOM(this, domNode);
		[node, this, parent, previous, this.getPrevious()].each(function(node){
			Mif.Tree.Draw.update(node);
		});
		this.tree.select(this);
		this.tree.$getIndex();
		this.tree.scrollTo(this);
		return this;
	},
	
	copy: function(node, where){
		function copy(structure){
			var node=structure.node;
			var tree=structure.tree;
			var options=$unlink({
				property: node.property,
				type: node.type,
				state: node.state,
				data: node.data
			});
			options.state.open=false;
			var nodeCopy = new Mif.Tree.Node({
				parent: structure.parentNode,
				children: [],
				tree: tree
			}, options);
			node.children.each(function(child){
				var childCopy=copy({
					node: child,
					parent: nodeCopy,
					tree: tree
				})
				nodeCopy.children.push(childCopy);
			});
			return nodeCopy;
		}
		var nodeCopy=copy({
			node: this,
			parent: null,
			tree: this.tree
		});
		return nodeCopy.inject(node, where, Mif.Tree.Draw.node(nodeCopy));
	},
	
	remove: function(){
		this.tree.fireEvent('remove', [this]);
		var parent=this.parentNode, previous=this.getPrevious();
		if(parent) parent.children.erase(this);
		this.tree.selected=false;
		this.getDOM('node').destroy();
		Mif.Tree.Draw.update(parent);
		Mif.Tree.Draw.update(previous);
		this.tree.mouse.node=false;
		this.tree.updateHover();
		this.tree.$getIndex();
	}
	
});


Mif.Tree.implement({

	move: function(from, to, where){
		if ( from.inject(to, where) ){
			this.fireEvent('move', [from, to, where]);
		}
		return this;
	},
	
	copy: function(from, to, where){
		var copy = from.copy(to, where);
		if ( copy ){
			this.fireEvent('copy', [from, to, where, copy]);
		}
		return this;
	},
	
	remove: function(node){
		node.remove();
		return this;
	},
	
	add: function(node){
		
	}
	
});

Array.implement({
	
	inject: function(added, current, where){//inject added after or before current;
		var pos=this.indexOf(current)+(where=='before' ? 0 : 1);
		for(var i=this.length-1;i>=pos;i--){
			this[i+1]=this[i];
		}
		this[pos]=added;
		return this;
	}
	
});

/*
Mif.Tree.Drag
*/
Mif.Tree.Drag = new Class({
	
	Implements: [new Events, new Options],
	
	options:{
		snap: 4,
		animate: true,
		open: 600,//time to open node
		scrollDelay: 100,
		scrollSpeed: 100,
		modifier: 'control',//copy
		startPlace: ['icon', 'name']
	},

	initialize: function(tree, options){
		tree.drag=this;
		this.setOptions(options);
		$extend(this,{
			tree: tree,
			dragged: false,
			snap: this.options.snap
		});
		$extend(tree.defaults, {
			dropDenied: [],
			dragDisabled: false
		});
		tree.addEvent('drawRoot',function(){
			tree.root.dropDenied.include('before').include('after');
		});
		this.pointer=new Element('div').addClass('mif-tree-pointer').injectInside(tree.wrapper);
		this.dragTargetSelect();
		this.attachMouseEvents();
		this.attachEvents();
	},
	
	dragTargetSelect: function(){
		function addDragTarget(){
			this.current.getDOM('name').addClass('mif-tree-drag-current')
		}
		function removeDragTarget(){
			this.current.getDOM('name').removeClass('mif-tree-drag-current');
		}
		this.addEvent('start',addDragTarget.bind(this));
		this.addEvent('beforeComplete',removeDragTarget.bind(this));
	},

	attachMouseEvents: function(){
		this.tree.wrapper.addEvents({
			mousedown: this.mousedown.bindWithEvent(this),
			mouseup: this.mouseup.bind(this),
			mousemove: this.mousemove.bindWithEvent(this),
			keydown: this.keydown.bindWithEvent(this),
			mouseleave: this.mouseleave.bind(this)
		});
		document.addEvent('mouseup',this.externalUp.bind(this));
		this.pointer.addEvents({
			'mouseup' : this.mouseup.bind(this),
			'mousemove' : this.mousemove.bindWithEvent(this) 
		});
	},

	mousedown: function(event){
		if(this.current || this.$completing) return;
		var target=this.tree.mouse.target;
		if(!target) return;
		this.current=$splat(this.options.startPlace).contains(target) ? this.tree.mouse.node : false;
		if(!this.current) return;
		if(this.current.DDdisabled){
			this.current=false;
		}
		if(this.current){
			this.startX = event.client.x;
			this.startY = event.client.y;
		}
	},
	
	mousemove: function(event){
		if(!this.current || this.$completing ||
			(!this.dragged && Math.sqrt(Math.pow(event.client.x-this.startX,2)+Math.pow(event.client.y-this.startY,2))<this.snap)
		) return false;
		if(!this.dragged){
			this.start(event);
		}else{
			this.check(event);
			this.autoScroll(event);
		}
	},

	mouseup: function(){
		if(this.$completing) return;
		if (this.dragged) {
			this.clean();
			$clear(this.scrolling);
			this.$completing=true;
			this.fireEvent('beforeComplete');
			this.drop();
		}else if(this.current){
			this.current=false;
		}
		
	},
	
	externalUp: function(){
		if(this.dragged){
			this.fireEvent('cancel');
		}
	},
	
	mouseleave: function(){
		if(this.dragged) {
			this.where='notAllowed';
			this.fireEvent('drag');
		}
	},
	
	keydown: function(event){
		if(event.key=='esc'){
			this.fireEvent('cancel');
		}
	},
	
	autoScroll: function(event){
		var y=this.y;
		if(y==-1) return;
		var wrapper=this.tree.wrapper;
		var top=y-wrapper.scrollTop;
		var bottom=wrapper.offsetHeight-top;
		var sign=0;
		if(top<this.tree.height){
			var delta=top;
			sign=1;
		}else if(bottom<this.tree.height){
			var delta=bottom;
			sign=-1;
		}
		if(sign && !this.scrolling){
			this.scrolling=function(node){
				if(y!=this.y){
					y=this.y;
					delta = (sign==1 ? (y-wrapper.scrollTop) : (wrapper.offsetHeight-y+wrapper.scrollTop))||1;
				}
				wrapper.scrollTop=wrapper.scrollTop-sign*this.options.scrollSpeed/delta;
			}.periodical(this.options.scrollDelay, this, [sign])
		}
		if(!sign){
			$clear(this.scrolling);
			this.scrolling=null;
		}
	},
	
	attachEvents: function(){
		this.addEvent('drag', this.drag.bind(this));
		this.addEvent('complete', this.complete.bind(this));
		this.addEvent('cancel', this.cancel.bind(this));
	},
	
	start: function(event){
		this.tree.unselect();
		this.addGhost(event);
		this.dragged=true;
		this.fireEvent('start');
	},
	
	cancel: function(){
		this.where='notAllowed';
		this.mouseup();
	},
	
	complete: function(){
		this.target=false;
		this.current=false;
		this.where=false;
		this.dragged=false;
		this.$completing=false;
		this.ghost.dispose();
	},

	drag: function(){
		this.clean();
		var where=this.where;
		var target=this.target;
		var ghostType=where;
		if(where=='after'&&(target.getNext())||where=='before'&&(target.getPrevious())){
			ghostType='between';
		}
		this.ghost.firstChild.className='mif-tree-ghost-icon mif-tree-ghost-'+ghostType;
		if(where == 'notAllowed'){
			this.tree.unselect();
			return;
		}
		this.tree.select(target);
		if(where == 'inside'){
			if(!target.isOpen() && !this.openTimer && (target.loadable||target.hasChildren()) ){
				this.wrapper=target.getDOM('wrapper');
				this.wrapper.style.cursor='progress';
				this.openTimer=function(){
					target.toggle();
					this.clean();
				}.delay(this.options.open,this);
			}
		}else{
			var wrapper=this.tree.wrapper;
			var top=this.index*this.tree.height;
			if(where=='after') top+=this.tree.height;
			this.pointer.setStyles({
				display: 'block',
				left: wrapper.scrollLeft,
				top: top,
				width: wrapper.clientWidth
			});
		}
	},

	clean: function(){
		this.pointer.style.width=0;
		if(this.openTimer){
			$clear(this.openTimer);
			this.openTimer=false;
			this.wrapper.style.cursor='inherit';
			this.wrapper=false;
		}
	},
	
	addGhost: function(event){
		var wrapper=this.current.getDOM('wrapper');
		var ghost=new Element('span').addClass('mif-tree-ghost');
		ghost.adopt(Mif.Tree.Draw.node(this.current).getFirst());
		ghost.injectInside(document.body)
			.addClass('mif-tree-ghost-notAllowed')
			.setStyles({
				position:'absolute',
				left:event.page.x+20,
				top:event.page.y+20
			})
			.makeDraggable().start(event);
		new Element('span').set('html',Mif.Tree.Draw.zeroSpace).injectTop(ghost);
		ghost.getLast().getFirst().className='';
		this.ghost=ghost;
	},
	
	check: function(event){
		this.y=this.tree.mouse.coords.y;
		var target=this.tree.mouse.node;
		this.target=target;
		if(!target){
			this.target=false;
			this.where='notAllowed';
			this.fireEvent('drag');
			return;
		}
		if(this.current.contains(target)){
			this.where='notAllowed';
			this.fireEvent('drag');
			return;
		}
		this.index=Math.floor(this.y/this.tree.height)
		var delta=this.y-this.index*this.tree.height;
		var deny=this.target.dropDenied;
		if(this.tree.sortable){
			deny.include('before').include('after');
		}
		var where;
		if(!deny.contains('inside') && delta>(this.tree.height/4) && delta<(3/4*this.tree.height)){
			where='inside';
		}else{
			if(delta<this.tree.height/2){
				if(deny.contains('before')){
					if(deny.contains('inside')){
						where=deny.contains('after') ? 'notAllowed' : 'after';
					}else{
						where='inside';
					}
				}else{
					where='before';
				}
			}else{
				if(deny.contains('after')){
					if(deny.contains('inside')){
						where=deny.contains('before') ? 'notAllowed' : 'before';
					}else{
						where='inside';
					}
				}else{
					where='after';
				}
			}
		}
		if(this.where==where && this.target==target) return;
		this.where=where; this.target=target;
		this.fireEvent('drag');
	},
	
	drop: function(){
		var current=this.current, target=this.target, where=this.where;
		if(this.where=='notAllowed'){
			var scroll=this.tree.scroll;
			scroll.addEvent('complete',function(){
				scroll.removeEvent('complete', arguments.callee);
				if(this.options.animate){
					var wrapper=current.getDOM('wrapper');
					var position=wrapper.getPosition();
					this.ghost.set('morph',{
						duration: 'short',
						onComplete: function(){
							this.fireEvent('complete', [current, target, where]);
						}.bind(this)
					});
					this.ghost.morph({left: position.x, top: position.y});
					return;
				};
				this.fireEvent('complete', [current, target, where]);
				return;
			}.bind(this));
			this.tree.select(this.current);
			this.tree.scrollTo(this.current);
			return;
		}
		var action=this.tree.key[this.options.modifier] ? 'copy' : 'move';
		if(this.where=='inside' && !target.isOpen()){
			target.toggle();
			if(target.$loading){
				var self=this;
				var onLoad=function(){
					self.tree[action](current, target, where);
					self.fireEvent('complete');
					target.removeEvent('load',onLoad);
				}
				target.addEvent('load',onLoad);
				return;
			}
		}
		this.tree[action](current, target, where);
		this.fireEvent('complete', [current, target, where]);
	}
});


/*
Mif.Tree.Rename
*/
Mif.Tree.implement({
	
	attachRenameEvents: function(){
		this.wrapper.addEvents({
			click: function(event){
				if($(event.target).get('tag')=='input') return;
				this.renameComplete();
			}.bind(this),
			keydown: function(event){
				if(event.key=='enter'){
					this.renameComplete();
				}
				if(event.key=='esc'){
					this.renameCancel();
				}
			}.bind(this)
		});
	},
	
	disableEvents: function(){
		if(!this.eventStorage) this.eventStorage=new Element('div');
		this.eventStorage.cloneEvents(this.wrapper);
		this.wrapper.removeEvents();
	},
	
	enableEvents: function(){
		this.wrapper.removeEvents();
		this.wrapper.cloneEvents(this.eventStorage);
	},
	
	getInput: function(){
		if(!this.input){
			this.input=new Element('input').addClass('mif-tree-rename');
			this.input.addEvent('focus',function(){this.select()});
			Mif.Tree.Rename.autoExpand(this.input);
		}
		return this.input;
	},
	
	startRename: function(node){
		this.unselect();
		this.disableEvents();
		this.attachRenameEvents();
		var input=this.getInput();
		input.value=node.name;
		this.renameName=node.getDOM('name');
		this.renameNode=node;
		input.setStyle('width', this.renameName.offsetWidth+15);
		input.replaces(this.renameName);
		input.focus();
	},
	
	finishRename: function(){
		this.renameName.replaces(this.getInput());
	},
		
	renameComplete: function(){
		this.enableEvents();
		this.finishRename();
		var node=this.renameNode;
		var oldName=node.name;
		node.set({
			property:{
				name: this.getInput().value
			}
		});
		this.fireEvent('rename', [node, node.name, oldName]);
		this.select(node);
	},
	
	renameCancel: function(){
		this.enableEvents();
		this.finishRename();
		this.select(this.renameNode);
	}
	
});

Mif.Tree.Node.implement({
	
	rename: function(){
		this.tree.startRename(this);
	}
	
});

Mif.Tree.Rename={
	
	autoExpand: function(input){
		var span=new Element('span').addClass('mif-tree-rename').setStyles({
			position: 'absolute',
			left: -2000,
			top:0,
			padding: 0
		}).injectInside(document.body);
		input.addEvent('keydown',function(event){
			(function(){
			input.setStyle('width',Math.max(20, span.set('html', input.value.replace(/\s/g,'&nbsp;')).offsetWidth+15));
			}).delay(10);
		});
	}
	
}


/*
Mif.Tree.Row
*/
Mif.Tree.implement({

	initRows: function(){
		this.addRowWrapper();
		this.addEvent('drawRoot',function(){
			new Element('div',{'id':'mif-tree-row-'+this.root.UID, "class": 'mif-tree-row'}).injectInside(this.rowWrapper);
			new Element('div').addClass('mif-tree-row-container').injectInside(this.rowWrapper);
		}.bind(this));
		this.addEvent('drawChildren',function(node){
			Mif.Tree.Draw.rowChildren(node);
		});
		this.addEvent('toggle',function(node, state){
			node.getRowDOM('container').style.display=state ? 'block' : 'none';
		});
		this.addEvent('selectChange',function(node, state){
			node.getRowDOM('node')[(state ? 'add' : 'remove') + 'Class']('mif-tree-row-selected');
		});
		this.addEvent('hover', function(node, target, state){
			if(target!='node'||!node) return;
			var domNode=node.getRowDOM('node');
			var action=(state=='over' ? 'add' : 'remove') +'Class';
			domNode[action]('mif-tree-row-hover');
			if(node.state.selected) domNode[action]('mif-tree-row-hover-selected');
		}.bind(this));
		this.addEvent('structureChange', function(from, to, where, type){
			if(type=='copy'){
				var dom=Mif.Tree.Draw.row(from);
				var fromNode=dom.getFirst(), fromContainer = dom.getLast();
			}else{
				var fromNode=from.getRowDOM('node'), fromContainer=from.getRowDOM('container');
			}
			this.injectRowDOM(fromNode, fromContainer, to, where);
		});
		this.addEvent('remove', function(node){
			node.getRowDOM('node').destroy();
		});
		this.addEvent('updateNode',function(node){
			node.getRowDOM('container').style.display=node.isOpen() ? 'block' : 'none';
		});
	},
	
	injectRowDOM: function(fromNode, fromContainer, to, where){
		var toNode=to.getRowDOM('node'), toContainer=to.getRowDOM('container');
		switch(where){
			case 'inside':
				fromNode.injectInside(toContainer);
				fromContainer.injectInside(toContainer);
				break;
			case 'before':
				fromNode.injectBefore(toNode);
				fromContainer.injectBefore(toNode);
				break;
			case 'after':
				fromNode.injectAfter(toContainer);
				fromContainer.injectAfter(fromNode);
				break;
		}
		this.updateHover();
	},
	
	addRowWrapper: function(){
		var wrapper=this.wrapper;
		var rowWrapper=new Element('div').injectTop(this.container).addClass('mif-tree-row-wrapper');
		this.rowWrapper=rowWrapper;
		wrapper.addEvent('scroll', function(event){//sync scroll
			rowWrapper.scrollTop=wrapper.scrollTop;
		});
		if(Browser.Engine.presto){
			wrapper.addEvent('mousewheel',function(){
				(function(){rowWrapper.scrollTop=wrapper.scrollTop;}).delay(50);
			});
		}
	}

});

Mif.Tree.Draw.rowChildren=function(node){
	if(node.tree.forest && !node.getParent()){
		var container=node.tree.rowWrapper;
	}else{
		var container=node.getRowDOM('container');
	}
	var html=[];
	var children=node.children;
	for( var i=children.length; i--; i>=0 ){
		var child=children[i];
		html.unshift('<div id="mif-tree-row-',child.UID,'" class="mif-tree-row"></div><div class="mif-tree-row-container"></div>');
	}
	container.set('html',html);
}

Mif.Tree.Draw.row=function(node){
	return new Element('div').set('html', '<div id="mif-tree-row-',node.UID,'" class="mif-tree-row"></div><div class="mif-tree-row-container"></div>');
}



Mif.Tree.Node.implement({

	getRowDOM: function(what){
		var node=$('mif-tree-row-'+this.UID);
		if(what=='node') return node;
		if(what=='container') return node.getNext();
	}

});


/*
Mif.Tree.Checkbox
*/
Mif.Tree.implement({

	initCheckbox: function(type){
		this.checkboxType=type||'simple';
		this.dfltState.checked='unchecked';
		this.wrapper.addEvent('click',this.checkboxClick.bindWithEvent(this));
		if(this.checkboxType=='simple') return;
		this.addEvent('loadChildren', function(node){
			if(node.state.checked=='unchecked') return;

			node.recursive(function(){
				this.state.checked='checked';
			});
		});
	},
	
	checkboxClick: function(event){
		if(this.mouse.target!='checkbox') {return;}
		this.mouse.node['switch']();
	},
	
	getChecked: function(){
		var checked=[];
		this.root.recursive(function(){
			if(this.state.checked) checked.push(checked);
		});
		return checked;
	}

});

Mif.Tree.Node.implement({

	'switch' : function(state){
		if(this.state.checked==state) return;
		var type=this.tree.checkboxType;
		var checked=(this.state.checked=='checked') ? 'unchecked' : 'checked';
		var setState=function(node, state){
			var oldState=node.state.checked;
			node.state.checked=state;
			if(!node.parentNode || (node.parentNode && node.parentNode.$draw)){
				node.getDOM('checkbox').removeClass('mif-tree-node-'+oldState).addClass('mif-tree-node-'+state);
			}
		};
		if(type=='simple'){
			setState(this, checked);
			return false;
		};
		this.recursive(function(){
			setState(this, checked);
		});
		function setParentCheckbox(node){
			if(!node.parentNode || (node.tree.forest && !node.parentNode.parentNode)) return;
			var parent=node.parentNode;
			var state='';
			var children=parent.children;
			for(var i=children.length; i--; i>0){
				var child=children[i];
				var childState=child.state.checked;
				if(childState=='partially'){
					state='partially';
					break;
				}else if(childState=='checked'){
					if(state=='unchecked'){
						state='partially';
						break;
					}
					state='checked';
				}else{
					if(state=='checked'){
						state='partially';
						break;
					}else{
						state='unchecked';
					}
				}
			}
			if(parent.state.checked==state){return;};
			setState(parent, state);
			setParentCheckbox(parent);
		}
		setParentCheckbox(this);
	}

});


