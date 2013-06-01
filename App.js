

Ext.define('TreesWithCardsItem', {
    extend: 'Rally.ui.tree.TreeItem', 
    xtype: 'treeswithcardsitem',
    
    listeners: {
//        select: function(){
//            debugger;
////            this.card = Ext.create('card', {
////                
////            });
//        }
    }
});


Ext.define('TreesWithCards', {
    extend: 'Rally.ui.tree.Tree',
    getTreeItemConfigForRecordFn: function(){
        return function(){
            xtype: 'treeswithcardsitem'
        };
    },
    makeTreeItemDraggable: function(treeItem){
        var tree = this;

        if(treeItem.getCanDrag()){
            var me = this;
            var dragSource = Ext.create('Ext.dd.DragSource', treeItem.getEl(), {
                treeItem: treeItem,
                getDragData: function() {
                    var ret = {
                        card: Ext.create('Rally.ui.cardboard.Card', {
                            record: treeItem.getRecord()    
                        }),
                        column: {
                            findCardInfo: function() {
                                return { 
                                    index: -1
                                };
                            }
                        }
                    };
                    return ret;
                },
                ddGroup: 'cardboard',
                isTarget: false,
                proxy: Ext.create('Ext.dd.StatusProxy', {
                    animRepair: true,
                    shadow: false,
                    dropNotAllowed: 'rallytree-proxy'
                }),
                beforeDragDrop: function(){
                    me.fireEvent('drag', treeItem);
                    return true;
                },
                afterDragDrop: function(){
                    me.fireEvent('drop', treeItem);
                }
            });

            dragSource.setHandleElId(treeItem.getEl().down('.drag').id);
        }

        if(treeItem.getCanDropOnMe()){
            var dropTarget = Ext.create('Rally.ui.tree.TreeItemDropTarget', treeItem.down('#treeItemContent').getEl(), {
                tree: tree,
                treeItem: treeItem
            });

            if(treeItem.dropTarget){
                treeItem.dropTarget.unreg();
            }

            treeItem.dropTarget = dropTarget;

            var dropTargetGroups = this.getDragThisGroupOnMeFn().call(this.getScope(), treeItem.getRecord());
            if(!Ext.isArray(dropTargetGroups)){
                dropTargetGroups = [dropTargetGroups];
            }
            Ext.each(dropTargetGroups, function(dropTargetGroup){
                dropTarget.addToGroup(dropTargetGroup);
            });
        }

    },
    treeItemConfigForRecordFn: function(record){
        var card = Ext.create('Rally.ui.cardboard.Card', {
            record: record
        });
        return {
            xtype: 'treeswithcardsitem',
            canDrag: true,
            expanded: true,
            record: record,
            card: card 
        };
    }
});



Ext.define('PlanPlanPalatable', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: 'hbox',
    items: [
        {
            itemId: 'accContainer',
            layout: 'accordion',
            defaults: {
                bodyPadding: 10
            },
            height: '100%',
            items: [
                {
                    title: 'Story Hierarchy',
                    itemId: 'storyHierarchyPanel',
                    resizable: true,
                    autoScroll: true,
                    height: '100%'
                },
                {
                    title: 'Orphaned Stories',
                    itemId: 'orphanStories',
                    resizable: true,
                    autoScroll: true
                },
                {
                    title: 'Defects',
                    itemId: 'defects',
                    resizable: true,
                    autoScroll: true
                }
            ],
            flex: 1
            
        },              
        {
            xtype: 'container',
            cls: 'rightSide',
            itemId: 'rightSide',
            flex: 1,
            height: '100%',
            autoScroll: true
        }
    ],

    launch: function() {
        this.buildStoryTree();
        this.buildOrphanedStoryTree();
        this.buildDefectTree();
        this.buildIterationsAndReleases();
    },

    buildStoryTree: function(){        
        var storyTree = Ext.create('PlanIterationsAndReleases.StoryTree');        
		this.down('#storyHierarchyPanel').add(storyTree);
    },
    
    buildOrphanedStoryTree: function() {
        var parentFilter = Ext.create('Rally.data.QueryFilter', {
            property: 'Feature',
            value: 'null',
            operator: '='
        });

        var stateFilter = Ext.create('Rally.data.QueryFilter', {
            property: 'ScheduleState',
            value: 'Accepted',
            operator: '!='
        });
        
        var iterationFilter = Ext.create('Rally.data.QueryFilter', {
            property: 'Iteration',
            value: 'null',
            operator: '='
        });
        
        var filter = parentFilter.and(stateFilter).and(iterationFilter);
//        var orphanStoryTree = Ext.create('Rally.ui.tree.UserStoryTree', {
//            topLevelStoreConfig: {
//                fetch: ['FormattedID', 'Name', 'ObjectID', 'DirectChildrenCount', 'ScheduleState', 'Workspace', 'Iteration', 'TaskStatus', 'WorkProduct', 'Project', 'Parent'],
//                filters: filter,
//                canDrag: true,
//                sorters: [{
//                    property: 'Rank',
//                    direction: 'asc'
//                }],
//                listeners: {
//                    'load': function(store, records, successful, options) {
//                        if (store.totalCount > 200) {
//                            Rally.ui.notify.Notifier.showError({message: 'There are more than 200 orphaned stories.'});
//                        }    
//                    }
//                }
//            }
//        });
        
        
        var orphanStoryTree = Ext.create('TreesWithCards', {
            enableDragAndDrop: true,            
            dragDropGroupFn: function(record){
                return 'cardboard';
            },dragThisGroupOnMeFn: function(record){
                return 'cardboard';
            },
            topLevelStoreConfig: {
                model: 'User Story',
                fetch: ['FormattedID', 'Name', 'ObjectID', 'DirectChildrenCount', 'ScheduleState', 'Workspace', 'Iteration', 'TaskStatus', 'WorkProduct', 'Project', 'Parent'],
                filters: filter,
                canDrag: true,
                sorters: [{
                    property: 'Rank',
                    direction: 'asc'
                }],
                listeners: {
                    'load': function(store, records, successful, options) {
                        if (store.totalCount > 200) {
                            Rally.ui.notify.Notifier.showError({message: 'There are more than 200 orphaned stories.'});
                        }
                    }
                }
            }            
        });
        
        this.down('#orphanStories').add(orphanStoryTree);
    },
    
    buildDefectTree: function(){
        var defectTree = Ext.create('TreesWithCards', {
            enableDragAndDrop: true,            
            dragDropGroupFn: function(record){
                return 'cardboard';
            },dragThisGroupOnMeFn: function(record){
                return 'cardboard';
            },
            topLevelStoreConfig: {
                model: 'Defect',
                filters: [
                    {
                        property: 'ScheduleState',
                        value: 'Accepted',
                        operator: '!='
                    },
                    {
                        property: 'Iteration',
                        value: 'null',
                        operator: '='
                    }],
                sorters: [{
                    property: 'Rank',
                    direction: 'asc'
                }],
                listeners: {
                    'load': function(store, records, successful, options) {
                        if (store.totalCount > 200) {
                            Rally.ui.notify.Notifier.showError({message: 'There are more than 200 defects.'});
                        }
                    }
                }
            }
        });
        this.down('#defects').add(defectTree);
    },
    
//    buildIterationTree: function() {
//        var iterationTree = Ext.create('Rally.ui.tree.Tree', {
//            topLevelStoreConfig: {
//                model: 'Iteration',
//                filters: [
//                    {
//                        property:
//                    }
//            }
//        })
//    },
    
    buildIterationsAndReleases: function(){
        
        this._getBoardData();
//        var cardBoardConfig = this.buildIterationCardboardConfig(model, iterations);
        
//        var cardBoardConfig = {
//            xtype: 'rallycardboard',
//            types: ['User Story', 'Defect'],
//            attribute: "ScheduleState",
//            draggable: true,
//            ddGroup: 'cardboard',
//            dragThisGroupOnMeFn: function(record){
//                return 'cardboard';
//            },
//            listeners: {
//                'beforeadd': function(component, index, eOpts ) {
////                    debugger;
//                }
//            }
//        };
        
//        this.down('#rightSide').add(cardBoardConfig);
        
        //var iterationsAndReleases = Ext.create('PlanIterationsAndReleases.IterationsAndReleases');
        //this.down('#rightSide').add(iterationsAndReleases);
    },
    
    _getBoardData: function() {
        Rally.data.ModelFactory.getModel({
          type: 'Iteration',
          success: this._onModelSuccess,
          scope: this
      });
    },
    
    _onModelSuccess: function(model) {
        this.model = model;
        Ext.create('Rally.data.WsapiDataStore', {
          model: model,
          fetch: ['Name', 'StartDate', 'EndDate', 'Project', 'PlannedVelocity'],
          autoLoad: true,
          listeners: {
              load: this._onIterationsLoad,
              scope: this
          },
          limit: Infinity
        });
    },
    
    _onIterationsLoad: function(store) {
        var cardBoardConfig = this.buildIterationCardboardConfig(store);
        this.down('#rightSide').add(cardBoardConfig);
    },
    
    buildIterationCardboardConfig: function(store) {
        return {
            types: ['User Story', 'Defect'],
            attribute: 'Iteration',
            xtype: 'iterationcardboard',
            store: store,
            ddGroup: 'cardboard',
            dragThisGroupOnMeFn: function(record){
                return 'cardboard';
            },
            cardboardContainerEl: this.down('#rightSide').getEl()
            
        };
    }

});
