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
        //this.buildOrphanedStoryTree();
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
        var orphanStoryTree = Ext.create('Rally.ui.tree.UserStoryTree', {
            topLevelStoreConfig: {
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
    
    buildIterationsAndReleases: function(){
        var iterationsAndReleases = Ext.create('PlanIterationsAndReleases.IterationsAndReleases');
        this.down('#rightSide').add(iterationsAndReleases);
    }

});
