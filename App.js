Ext.define('TreesWithCards', {extend: 'Rally.ui.tree.Tree', fields: [
    {name: 'card', type: 'object', defaultValue: null}],
    treeItemConfigForRecordFn: function(){
        return {
            xtype: 'treeswithcardsitem'
        };
    }
});

Ext.define('TreesWithCardsItem', {
    extend: 'Rally.ui.tree.TreeItem', 
    alias: 'widget.treeswithcardsitem',
    card: {
        xtype: 'rallycard'
    },
    listeners: {
        afterrender: function(eOpts) {
            debugger;
            this.card.setRecord(this.getRecord());
        }
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
            /**
             * @cfg {Function}
             * Required to support drag and drop.
             * A function that returns the group name that this record is a member of.
             *
             * By default, returns the type name of the record, like 'hierarchicalrequirement' for userstories, and 'defect' for defects.
             * You will want to change this if type is not specific. For example, you may wish to distinguish accepted user stories from in progress stories.
             * Use in conjunction with the #dragThisGroupOnMeFn config to define DnD rules.
             */
            dragDropGroupFn: function(record){
                return 'cardboard';
            },
    
            /**
             * @cfg {Function}
             * Required to support drag and drop.
             * A function that returns the group name of records that are able to be dropped on the passed in record.
             *
             * For example, a tree of user stories would simply return 'hierarchicalrequirement', since
             * user stories can always be parented to other user stories. A tree of user stories and defects would need to have 'hierarchicalrequirement'
             * for the TreeItems representing user stories, but return undefined for defects so they can't be dropped on.
             * @param record the record you need to determine the group for.
             * @return a string representing the drag drop group that can be dragged onto the Rally.ui.tree.TreeItem represented by the passed in record.
             */
            dragThisGroupOnMeFn: function(record){
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
        var defectTree = Ext.create('Rally.ui.tree.Tree', {
            enableDragAndDrop: true,
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
        var cardBoardConfig = {
            xtype: 'rallycardboard',
            types: ['User Story', 'Defect'],
            attribute: "ScheduleState",
            draggable: true,
            ddGroup: 'cardboard',
            dragThisGroupOnMeFn: function(record){
                return 'cardboard';
            },
            listeners: {
                'beforeadd': function(component, index, eOpts ) {
//                    debugger;
                }
            }
        };
        
        this.down('#rightSide').add(cardBoardConfig);
        //var iterationsAndReleases = Ext.create('PlanIterationsAndReleases.IterationsAndReleases');
        //this.down('#rightSide').add(iterationsAndReleases);
    }

});
